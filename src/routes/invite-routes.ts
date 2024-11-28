import { Router } from "express";
import Authenticate from "../middlewares/auth/authenticate";
import AuthoriseSuperUser from "../middlewares/auth/authorize-super-user";
import { InviteController } from "../controllers/invite-controller";

const InviteRouter = Router();

InviteRouter.post('/', Authenticate, AuthoriseSuperUser, InviteController.sendInvite);
InviteRouter.post('/findByParams', Authenticate, AuthoriseSuperUser, InviteController.findByParams);

export default InviteRouter;