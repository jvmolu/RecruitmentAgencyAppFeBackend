// Express Server Typescript
import express from 'express';
import UserRouter from './routes/user-routes';
import CompanyRouter from './routes/comapny-routes';

const app: express.Application = express();
app.use(express.json());

app.use('/api/v1/users', UserRouter);
app.use('/api/v1/companies', CompanyRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});