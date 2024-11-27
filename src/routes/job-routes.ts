import { Router } from "express";
import { JobController } from "../controllers/job-controller";
import Authenticate from "../middlewares/auth/authenticate";

const JobRouter = Router();

JobRouter.post('/', Authenticate, JobController.createJob);
JobRouter.post('/findByParams', Authenticate, JobController.findByParams);
JobRouter.put('/updateJobs', Authenticate, JobController.updateJobs);

export default JobRouter;