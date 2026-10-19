import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

function isAuthPayload(value: string | jwt.JwtPayload): value is jwt.JwtPayload & {
  id: number;
  username: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    Number.isSafeInteger(value.id) &&
    typeof value.username === "string"
  );
}

export function authentication(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authHeader = request.headers.authorization;
  const secret = process.env.JWT_SECRET;

  if (!authHeader || !secret) {
    return response.status(401).json({ error: "Nao autenticado." });
  }

  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) {
    return response.status(401).json({ error: "Nao autenticado." });
  }

  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(match[1], secret);
  } catch {
    return response.status(401).json({ error: "Nao autenticado." });
  }

  if (!isAuthPayload(decoded)) {
    return response.status(401).json({ error: "Nao autenticado." });
  }

  if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
    request.body = {};
  }

  request.body.user = decoded;
  return next();
}
