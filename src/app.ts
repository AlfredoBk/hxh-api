import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(routes);
app.use((_request, response) => {
  return response.status(404).json({ error: "Rota nao encontrada." });
});
app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError) {
    return response.status(400).json({ error: "JSON invalido." });
  }
  console.error(error);
  return response.status(500).json({ error: "Erro interno do servidor." });
});

export default app;
