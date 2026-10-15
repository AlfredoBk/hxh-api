import { Prisma } from "../../generated/prisma/client";
import type { Response } from "express";

export function handleErrors(error: unknown, response: Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return response.status(404).json({ error: "Personagem nao encontrado." });
    }
    if (error.code === "P2002") {
      return response.status(409).json({ error: "Ja existe um registro com esses dados." });
    }
  }

  console.error(error);
  return response.status(500).json({ error: "Erro interno do servidor." });
}
