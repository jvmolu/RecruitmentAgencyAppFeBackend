import { Router } from "express";
import { InterviewController } from "../controllers/interview-controller";
import Authenticate from "../middlewares/auth/authenticate";

const InterviewRouter = Router();

InterviewRouter.post(
	"/start",
	Authenticate,
	InterviewController.startInterview
);

InterviewRouter.post(
    "/findByParams",
    Authenticate,
    InterviewController.findByParams
);

// User Cannot update interview as they are not the owner of the interview
// If this is allowed in future, do check that the user does not change the status of the interview
// InterviewRouter.post(
//     "/updateByParams",
//     Authenticate,
//     InterviewController.updateByParams
// );

InterviewRouter.post(
	"/submitQuestion",
	Authenticate,
	InterviewController.submitAndGenerateQuestion
);

export default InterviewRouter;