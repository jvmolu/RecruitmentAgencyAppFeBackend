import { Router } from "express";
import { CompanyController } from "../controllers/company-controller";
import Authenticate from "../middlewares/auth/authenticate";
import AuthoriseSuperUser from "../middlewares/auth/authorize-super-user";

const CompanyRouter = Router();

CompanyRouter.post('/', Authenticate, CompanyController.createCompany);
CompanyRouter.post('/findByParams', Authenticate, CompanyController.findByParams);
CompanyRouter.put('/', Authenticate, AuthoriseSuperUser, CompanyController.updateCompanies);

export default CompanyRouter;