import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { handleErrors } from "../helpers/handleErrors";

export default {
  login: async (request: Request, response: Response) => {
    try {
      const { username, password } = request.body ?? {};
      if (
        typeof username !== "string" ||
        !username.trim() ||
        typeof password !== "string" ||
        !password
      ) {
        return response.status(400).json({ error: "Informe username e password." });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { username: username.trim() },
      });
      if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
        return response.status(401).json({ error: "Usuario ou senha invalidos." });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("A variavel JWT_SECRET nao foi configurada.");
      }

      const token = jwt.sign(
        { id: usuario.id, username: usuario.username },
        secret,
        { expiresIn: "1h" },
      );
      return response.status(200).json({
        token,
        user: { id: usuario.id, username: usuario.username },
      });
    } catch (error) {
      return handleErrors(error, response);
    }
  },
};
