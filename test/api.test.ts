import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Express } from "express";
import bcrypt from "bcrypt";
import request from "supertest";

const testDirectory = mkdtempSync(join(tmpdir(), "hxh-api-tests-"));
process.env.DATABASE_URL = `file:${resolve(testDirectory, "test.db").replaceAll("\\", "/")}`;
process.env.JWT_SECRET = "test-secret-that-is-long-enough-for-jwt";

let app: Express;
let prisma: typeof import("../config/prisma").prisma;

before(async () => {
  ({ default: app } = await import("../src/app"));
  ({ prisma } = await import("../config/prisma"));

  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Usuario" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "username" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username")',
  );
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Personagem" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nome" TEXT NOT NULL,
      "apelido" TEXT,
      "tipoNen" TEXT NOT NULL,
      "afiliacao" TEXT NOT NULL,
      "idade" INTEGER,
      "descricao" TEXT,
      "imagemUrl" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

beforeEach(async () => {
  await prisma.personagem.deleteMany();
  await prisma.usuario.deleteMany();
});

after(async () => {
  await prisma.$disconnect();
  rmSync(testDirectory, { recursive: true, force: true });
});

async function login() {
  await prisma.usuario.upsert({
    where: { username: "test-hunter" },
    update: {
      passwordHash: await bcrypt.hash("correct-horse-battery", 4),
    },
    create: {
      username: "test-hunter",
      passwordHash: await bcrypt.hash("correct-horse-battery", 4),
    },
  });

  return request(app)
    .post("/login")
    .send({ username: "test-hunter", password: "correct-horse-battery" });
}

test("login returns a JWT and protected routes require it", async () => {
  const response = await login();
  assert.equal(response.status, 200);
  assert.equal(typeof response.body.token, "string");

  const unauthorized = await request(app).post("/personagens").send({});
  assert.equal(unauthorized.status, 401);
});

test("character routes support listing, reading, creating, updating and deleting", async () => {
  const loginResponse = await login();
  const authorization = { Authorization: `Bearer ${loginResponse.body.token}` };
  const character = {
    nome: "Gon Freecss",
    apelido: "Gon",
    tipoNen: "Reforco",
    afiliacao: "Associacao Hunter",
    idade: 12,
  };

  const created = await request(app).post("/personagens").set(authorization).send(character);
  assert.equal(created.status, 201);
  assert.equal(created.body.nome, character.nome);

  const listed = await request(app).get("/personagens");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.length, 1);

  const read = await request(app).get(`/personagens/${created.body.id}`);
  assert.equal(read.status, 200);
  assert.equal(read.body.id, created.body.id);

  const updated = await request(app)
    .put(`/personagens/${created.body.id}`)
    .set(authorization)
    .send({ afiliacao: "Familia Zoldyck" });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.afiliacao, "Familia Zoldyck");

  const deleted = await request(app)
    .delete(`/personagens/${created.body.id}`)
    .set(authorization);
  assert.equal(deleted.status, 200);
  assert.equal((await request(app).get(`/personagens/${created.body.id}`)).status, 404);
});

test("invalid character input and invalid credentials are rejected", async () => {
  const invalidLogin = await request(app)
    .post("/login")
    .send({ username: "test-hunter", password: "wrong-password" });
  assert.equal(invalidLogin.status, 401);

  const loginResponse = await login();
  const response = await request(app)
    .post("/personagens")
    .set({ Authorization: `Bearer ${loginResponse.body.token}` })
    .send({
      nome: "",
      tipoNen: "Reforco",
      afiliacao: "Associacao Hunter",
      extra: true,
    });
  assert.equal(response.status, 400);
});
