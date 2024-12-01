// src/routes/match-report-routes.ts
import { Router } from "express";
import { MatchReportController } from "../controllers/match-report-controller";
import Authenticate from "../middlewares/auth/authenticate";
import AuthoriseSuperUser from "../middlewares/auth/authorize-super-user";

const MatchReportRouter = Router();

MatchReportRouter.post('/', Authenticate, AuthoriseSuperUser, MatchReportController.createMatchReport);
MatchReportRouter.post('/findByParams', Authenticate, AuthoriseSuperUser, MatchReportController.findByParams);

export default MatchReportRouter;