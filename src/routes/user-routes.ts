import { Router } from "express";
import { UserController } from "../controllers/user-controller";
import Authenticate from "../middlewares/auth/authenticate"

const UserRouter = Router();

// Register a new user
UserRouter.post('/', UserController.createUser);

// Login a user
UserRouter.post('/login', UserController.loginUser);

// Get all users - only for admin
UserRouter.get('/findAllUsers', Authenticate, UserController.findAllUsers); 

// Get user by token
UserRouter.get('/', Authenticate, UserController.findUserByToken);

// Get user by params
UserRouter.post('/findByParams', Authenticate, UserController.findUsersByParams);

export default UserRouter;
