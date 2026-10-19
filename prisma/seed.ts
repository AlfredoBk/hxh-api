import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";

async function main() {
  const username = "hunter";
  const password = "Gon123";
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
