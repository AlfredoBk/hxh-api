import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, before, test } from "node:test";
import bcrypt from "bcrypt";
import request from "supertest";

const username = "examiner";
const password = "hunter-exam-password";
const jwtSecret = "test-jwt-secret-at-least-32-characters-long";
let temporaryDirectory: string;
let api: ReturnType<typeof request>;
let disconnect: (() => Promise<void>) | undefined;

before(async () => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "hxh-api-test-"));
  process.env.DATABASE_URL = `file:${join(temporaryDirectory, "test.db")}`;
  process.env.JWT_SECRET = jwtSecret;

  execFileSync(
    process.execPath,
    [
      resolve("node_modules/prisma/build/index.js"),
      "db",
      "push",
    ],
    { stdio: "pipe", env: process.env },
  );

  const appModule = await import("../src/app");
  const { prisma } = await import("../config/prisma");
  api = request(appModule.default);
  disconnect = () => prisma.$disconnect();

  await prisma.usuario.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 4),
    },
  });
});

after(async () => {
  await disconnect?.();
  if (temporaryDirectory) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("HxH API supports login and authenticated character CRUD", async (context) => {
  const health = await api.get("/");
  assert.equal(health.status, 200);
  assert.match(health.body.message, /Hunter x Hunter/);

  await context.test("rejects malformed and missing credentials", async () => {
    const invalidLogin = await api
      .post("/login")
      .send({ username, password: "wrong-password" });
    assert.equal(invalidLogin.status, 401);

    const missingToken = await api.post("/personagens").send({});
    assert.equal(missingToken.status, 401);

    const malformedToken = await api
      .post("/personagens")
      .set("Authorization", "Bearer invalid.extra")
      .send({});
    assert.equal(malformedToken.status, 401);
  });

  const login = await api.post("/login").send({ username, password });
  assert.equal(login.status, 200);
  assert.equal(typeof login.body.token, "string");
  const authorization = `Bearer ${login.body.token}`;

  const extraAuthorizationPart = await api
    .post("/personagens")
    .set("Authorization", `${authorization} extra`)
    .send({});
  assert.equal(extraAuthorizationPart.status, 401);

  const character = {
    nome: "Gon Freecss",
    apelido: "Gon",
    tipoNen: "Reforco",
    afiliacao: "Associacao Hunter",
    idade: 12,
    descricao: "Hunter em treinamento",
    imagemUrl: "https://example.com/gon.jpg",
  };

  const list = await api.get("/personagens");
  assert.equal(list.status, 200);
  assert.deepEqual(list.body, []);

  const create = await api
    .post("/personagens")
    .set("Authorization", authorization)
    .send(character);
  assert.equal(create.status, 201);
  assert.equal(create.body.nome, character.nome);
  const id = create.body.id as number;
  assert.ok(Number.isInteger(id));

  const getById = await api.get(`/personagens/${id}`);
  assert.equal(getById.status, 200);
  assert.equal(getById.body.tipoNen, character.tipoNen);

  const update = await api
    .put(`/personagens/${id}`)
    .set("Authorization", authorization)
    .send({ tipoNen: "Reforco aprimorado" });
  assert.equal(update.status, 200);
  assert.equal(update.body.tipoNen, "Reforco aprimorado");

  const invalidId = await api.get("/personagens/0");
  assert.equal(invalidId.status, 400);

  const remove = await api
    .delete(`/personagens/${id}`)
    .set("Authorization", authorization);
  assert.equal(remove.status, 200);

  const missingCharacter = await api.get(`/personagens/${id}`);
  assert.equal(missingCharacter.status, 404);
});
