// Express Server Typescript
import express from 'express';
import UserRouter from './routes/user-routes';
import CompanyRouter from './routes/comapny-routes';
import JobRouter from './routes/job-routes';
import InviteRouter from './routes/invite-routes';
import MatchReportRouter from './routes/match-report-routes';
import MatchRouter from './routes/match-routes';

const app: express.Application = express();
app.use(express.json());

app.use('/api/v1/users', UserRouter);
app.use('/api/v1/companies', CompanyRouter);
app.use('/api/v1/jobs', JobRouter);
app.use('/api/v1/invites', InviteRouter);
app.use('/api/v1/match-reports', MatchReportRouter);
app.use('/api/v1/matches', MatchRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});