import { Router } from "express";
import { InterviewController } from "../controllers/interview-controller";
import Authenticate from "../middlewares/auth/authenticate";

const InterviewRouter = Router();

InterviewRouter.post(
	"/start",
	Authenticate,
	InterviewController.startInterview
);

export default InterviewRouter;