import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

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
  const authorization = request.headers.authorization;
  const [scheme, token] = authorization?.split(" ") ?? [];
  const secret = process.env.JWT_SECRET;

  if (scheme !== "Bearer" || !token || !secret) {
    return response.status(401).json({ error: "Nao autenticado." });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!isAuthPayload(decoded)) {
      return response.status(401).json({ error: "Nao autenticado." });
    }
    request.user = { id: decoded.id, username: decoded.username };
    return next();
  } catch {
    return response.status(401).json({ error: "Nao autenticado." });
  }
}
