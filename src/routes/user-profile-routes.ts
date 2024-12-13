import { Router } from "express";
import Authenticate from "../middlewares/auth/authenticate";
import IsPdfFile from "../middlewares/file-upload/file-pdf";
import MulterRequestParser from "../middlewares/file-upload/multer-file-parser";
import { UserProfileController } from "../controllers/user-profile-controller";
import AuthorizeSelf from "../middlewares/auth/authorize-same-user";

const UserProfileRouter = Router();

UserProfileRouter.post('/', Authenticate, MulterRequestParser, IsPdfFile, UserProfileController.createUserProfile);
UserProfileRouter.post('/findByParams', Authenticate, UserProfileController.findByParams);
UserProfileRouter.put('/', Authenticate, MulterRequestParser, IsPdfFile, AuthorizeSelf, UserProfileController.updateUserProfile);

export default UserProfileRouter;