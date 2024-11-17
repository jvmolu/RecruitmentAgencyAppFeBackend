import { Router } from "express";
import { UserController } from "../controllers/user-controller";

const UserRouter = Router();

UserRouter.post('/', UserController.createUser);
UserRouter.get('/', UserController.findAllUsers);

export default UserRouter;
