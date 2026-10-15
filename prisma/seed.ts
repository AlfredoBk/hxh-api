import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";

async function main() {
  const username = process.env.SEED_USERNAME?.trim();
  const password = process.env.SEED_PASSWORD;
  if (!username || !password || password === "change-this-seed-password") {
    throw new Error("Configure SEED_USERNAME e uma SEED_PASSWORD exclusiva no arquivo .env.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const usuario = await prisma.usuario.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
    select: { id: true, username: true },
  });
  console.info("Usuario criado ou atualizado:", usuario.username);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
