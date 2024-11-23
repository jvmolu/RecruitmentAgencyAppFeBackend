import { Router } from "express";
import { CompanyController } from "../controllers/company-controller";
import Authenticate from "../middlewares/auth/authenticate";

const CompanyRouter = Router();

CompanyRouter.post('/', Authenticate, CompanyController.createCompany);
CompanyRouter.post('/findByParams', Authenticate, CompanyController.findByParams);

export default CompanyRouter;