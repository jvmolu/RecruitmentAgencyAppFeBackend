import { Router } from "express";
import Authenticate from "../middlewares/auth/authenticate";
import IsPdfFile from "../middlewares/file-upload/file-pdf";
import MulterRequestParser from "../middlewares/file-upload/multer-file-parser";
import { ApplicationController } from "../controllers/applications-controller";
import AuthorizeSelf from "../middlewares/auth/authorize-same-user";
import MandateFileUpload from "../middlewares/file-upload/mandate-file-upload";

const ApplicationRouter = Router();

ApplicationRouter.post(
	"/",
	MulterRequestParser,
	Authenticate,
	MandateFileUpload,
	IsPdfFile,
	ApplicationController.createApplication
);
ApplicationRouter.post(
	"/findByParams",
	Authenticate,
	ApplicationController.findByParams
);
ApplicationRouter.put(
	"/",
	MulterRequestParser,
	Authenticate,
	IsPdfFile,
	AuthorizeSelf,
	ApplicationController.updateApplications
);
ApplicationRouter.post(
	"/evaluate-match",
	MulterRequestParser,
	Authenticate,
	IsPdfFile,
	ApplicationController.evaluateApplication
);

export default ApplicationRouter;
