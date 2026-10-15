import { Router } from "express";
import personagemController from "./controllers/personagem";
import usuarioController from "./controllers/usuario";
import { authentication } from "./middlewares/authentication";

const routes = Router();

routes.get("/", (_request, response) => {
  return response.status(200).json({ message: "API de Hunter x Hunter ativa." });
});

routes.post("/login", usuarioController.login);

routes.get("/personagens", personagemController.list);
routes.get("/personagens/:id", personagemController.getById);
routes.post("/personagens", authentication, personagemController.create);
routes.put("/personagens/:id", authentication, personagemController.update);
routes.delete("/personagens/:id", authentication, personagemController.delete);

export default routes;
