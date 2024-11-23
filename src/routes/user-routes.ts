import { Router } from "express";
import { UserController } from "../controllers/user-controller";

const UserRouter = Router();

UserRouter.post('/', UserController.createUser);
UserRouter.post('/login', UserController.loginUser);
UserRouter.get('/findAllUsers', UserController.findAllUsers); 
UserRouter.get('/', UserController.findUserByToken);

export default UserRouter;
