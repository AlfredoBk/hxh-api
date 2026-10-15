import "dotenv/config";
import http from "node:http";
import app from "./app";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Configure JWT_SECRET com pelo menos 32 caracteres no arquivo .env.");
}

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT deve ser um numero entre 1 e 65535.");
}

const server = http.createServer(app);
server.listen(port, () => {
  console.info(`Servidor escutando na porta ${port}`);
});
