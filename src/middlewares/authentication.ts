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
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return response.status(401).json({ error: "Nao autenticado." });
    }

    const [bearer, token] = authHeader.split(" ");
    const secret = process.env.JWT_SECRET;

    if (bearer !== "Bearer" || !token || !secret) {
      return response.status(401).json({ error: "Nao autenticado." });
    }     

    const decoded = jwt.verify(token, secret);
    if (!isAuthPayload(decoded)) {
      return response.status(401).json({ error: "Nao autenticado." });
    }

    if (!request.body || typeof request.body !== "object" || Array.isArray(request.body)) {
      request.body = {};
    }

    request.body.user = decoded;
    return next();
  } catch {
    return response.status(401).json({ error: "Nao autenticado." });
  }
}
