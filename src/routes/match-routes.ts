// src/routes/match-routes.ts
import { Router } from "express";
import { MatchController } from "../controllers/match-controller";
import Authenticate from "../middlewares/auth/authenticate";
import AuthoriseSuperUser from "../middlewares/auth/authorize-super-user";

const MatchRouter = Router();

MatchRouter.post('/', Authenticate, AuthoriseSuperUser, MatchController.createMatch);
MatchRouter.post('/findByParams', Authenticate, AuthoriseSuperUser, MatchController.findByParams);

export default MatchRouter;