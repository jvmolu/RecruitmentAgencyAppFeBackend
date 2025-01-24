import { Router } from "express";
import { InterviewController } from "../controllers/interview-controller";
import Authenticate from "../middlewares/auth/authenticate";
import MulterRequestParser from "../middlewares/file-upload/multer-file-parser";
import isMp4File from "../middlewares/file-upload/file-mp4";
import LockRouteFor60Seconds from "../middlewares/lock-route";

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
    MulterRequestParser,
	Authenticate,
    isMp4File,
	LockRouteFor60Seconds,
	InterviewController.submitAndGenerateQuestion
);

InterviewRouter.post(
	"/gradeInterview",
	Authenticate,
	InterviewController.gradeInterview
);

export default InterviewRouter;