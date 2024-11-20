// Express Server Typescript
import express from 'express';
import UserRouter from './routes/user-routes';

const app: express.Application = express();
app.use(express.json());

app.use('/api/v1/users', UserRouter);

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});