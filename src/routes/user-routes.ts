import { Router } from "express";
import { UserController } from "../controllers/user-controller";
import Authenticate from "../middlewares/auth/authenticate"
import AuthoriseSuperUser from "../middlewares/auth/authorize-super-user";

const UserRouter = Router();

// Register a new user
UserRouter.post('/', UserController.createUser);

// Login a user
UserRouter.post('/login', UserController.loginUser);

// Get user by token
UserRouter.get('/', Authenticate, UserController.findUserByToken);

// Get user by params
UserRouter.post('/findByParams', Authenticate, AuthoriseSuperUser, UserController.findUsersByParams);

// Generate OTP
UserRouter.post('/generateOTP', UserController.generateOTP);

// Verify OTP
UserRouter.post('/verifyOTP', UserController.verifyOTP);

export default UserRouter;
