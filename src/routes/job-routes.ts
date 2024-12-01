import { Router } from "express";
import { JobController } from "../controllers/job-controller";
import Authenticate from "../middlewares/auth/authenticate";
import AuthoriseSuperUser from "../middlewares/auth/authorize-super-user";

const JobRouter = Router();

JobRouter.post('/', Authenticate, JobController.createJob);

JobRouter.post('/findByParams', Authenticate, (req, res, next) => {
    if (req.params.is_show_applies === 'true' || req.params.is_show_matches === 'true') {
        AuthoriseSuperUser(req, res, next);
    } else {
        next();
    }
}, JobController.findByParams);

JobRouter.put('/', Authenticate, AuthoriseSuperUser, JobController.updateJobs);

// Only apply AuthoriseSuperUser middleware in the findJobsByParams route when is_applies param is passed as true


export default JobRouter;