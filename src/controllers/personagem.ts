import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { handleErrors } from "../helpers/handleErrors";

export default {
  list: async (_request: Request, response: Response) => {
    try {
      const personagens = await prisma.personagem.findMany();
      return response.status(200).json(personagens);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  getById: async (request: Request, response: Response) => {
    try {
      const id = Number(request.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return response.status(400).json({ error: "ID invalido." });
      }

      const personagem = await prisma.personagem.findUnique({ where: { id } });

      if (!personagem) {
        return response.status(404).json({ error: "Personagem nao encontrado." });
      }

      return response.status(200).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  create: async (request: Request, response: Response) => {
    try {
      const {
        nome,
        apelido,
        tipoNen,
        afiliacao,
        idade,
        descricao,
        imagemUrl,
      } = request.body ?? {};

      if (!nome || !tipoNen || !afiliacao) {
        return response.status(400).json({ error: "Dados do personagem incompletos." });
      }

      if (idade !== undefined && idade !== null && (!Number.isInteger(idade) || idade < 0)) {
        return response.status(400).json({ error: "Idade invalida." });
      }

      const personagem = await prisma.personagem.create({
        data: { nome, apelido, tipoNen, afiliacao, idade, descricao, imagemUrl },
      });

      return response.status(201).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  update: async (request: Request, response: Response) => {
    try {
      const id = Number(request.params.id);
      const {
        nome,
        apelido,
        tipoNen,
        afiliacao,
        idade,
        descricao,
        imagemUrl,
      } = request.body ?? {};

      if (!Number.isInteger(id) || id <= 0) {
        return response.status(400).json({ error: "ID invalido." });
      }

      if (
        nome === undefined &&
        apelido === undefined &&
        tipoNen === undefined &&
        afiliacao === undefined &&
        idade === undefined &&
        descricao === undefined &&
        imagemUrl === undefined
      ) {
        return response.status(400).json({ error: "Informe dados para atualizar." });
      }

      if (idade !== undefined && idade !== null && (!Number.isInteger(idade) || idade < 0)) {
        return response.status(400).json({ error: "Idade invalida." });
      }

      const personagem = await prisma.personagem.update({
        where: { id },
        data: { nome, apelido, tipoNen, afiliacao, idade, descricao, imagemUrl },
      });

      return response.status(200).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },

  delete: async (request: Request, response: Response) => {
    try {
      const id = Number(request.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return response.status(400).json({ error: "ID invalido." });
      }

      const personagem = await prisma.personagem.delete({ where: { id } });
      return response.status(200).json(personagem);
    } catch (error) {
      return handleErrors(error, response);
    }
  },
};
