import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../config/prisma";
import { handleErrors } from "../helpers/handleErrors";

const allowedFields = new Set([
  "nome",
  "apelido",
  "tipoNen",
  "afiliacao",
  "idade",
  "descricao",
  "imagemUrl",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidCharacterBody(body: unknown, partial: boolean): boolean {
  if (!isRecord(body)) return false;
  const keys = Object.keys(body);
  if (keys.length === 0 && partial) return false;
  if (keys.some((key) => !allowedFields.has(key))) return false;

  if (!partial) {
    for (const required of ["nome", "tipoNen", "afiliacao"]) {
      if (typeof body[required] !== "string" || !body[required].trim()) return false;
    }
  }

  for (const key of ["nome", "tipoNen", "afiliacao", "apelido", "descricao", "imagemUrl"]) {
    if (!Object.hasOwn(body, key)) continue;
    const value = body[key];
    const nullable = key === "apelido" || key === "descricao" || key === "imagemUrl";
    if (nullable && value === null) continue;
    if (typeof value !== "string" || !value.trim()) return false;
  }

  if (Object.hasOwn(body, "idade")) {
    const age = body.idade;
    if (age !== null && (typeof age !== "number" || !Number.isSafeInteger(age) || age < 0)) {
      return false;
    }
  }

  return true;
}

function isCreateInput(body: unknown): body is Prisma.PersonagemCreateInput {
  return isValidCharacterBody(body, false);
}

function isUpdateInput(body: unknown): body is Prisma.PersonagemUpdateInput {
  return isValidCharacterBody(body, true);
}

function parseId(value: string | string[]): number | null {
  if (typeof value !== "string") return null;
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export default {
  list: async (_request: Request, response: Response) => {
    try {
      const personagens = await prisma.personagem.findMany({ orderBy: { id: "asc" } });
      return response.status(200).json(personagens);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  getById: async (request: Request, response: Response) => {
    try {
      const id = parseId(request.params.id);
      if (!id) return response.status(400).json({ error: "ID invalido." });

      const personagem = await prisma.personagem.findUnique({ where: { id } });
      if (!personagem) return response.status(404).json({ error: "Personagem nao encontrado." });
      return response.status(200).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  create: async (request: Request, response: Response) => {
    try {
      if (!isCreateInput(request.body)) {
        return response.status(400).json({ error: "Dados do personagem invalidos ou incompletos." });
      }

      const personagem = await prisma.personagem.create({ data: request.body });
      return response.status(201).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  update: async (request: Request, response: Response) => {
    try {
      const id = parseId(request.params.id);
      if (!id) return response.status(400).json({ error: "ID invalido." });
      if (!isUpdateInput(request.body)) {
        return response.status(400).json({ error: "Informe campos validos para atualizar." });
      }

      const personagem = await prisma.personagem.update({ where: { id }, data: request.body });
      return response.status(200).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  delete: async (request: Request, response: Response) => {
    try {
      const id = parseId(request.params.id);
      if (!id) return response.status(400).json({ error: "ID invalido." });

      const personagem = await prisma.personagem.delete({ where: { id } });
      return response.status(200).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },
};
