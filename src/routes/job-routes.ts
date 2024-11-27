import { Router } from "express";
import { JobController } from "../controllers/job-controller";
import Authenticate from "../middlewares/auth/authenticate";
import AuthoriseSuperUser from "../middlewares/auth/authorize-super-user";

const JobRouter = Router();

JobRouter.post('/', Authenticate, JobController.createJob);
JobRouter.post('/findByParams', Authenticate, JobController.findByParams);
JobRouter.put('/', Authenticate, AuthoriseSuperUser, JobController.updateJobs);

export default JobRouter;