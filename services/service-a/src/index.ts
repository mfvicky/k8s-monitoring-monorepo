import express, { Request, Response } from 'express';
import { env } from './config/env';

const app = express();
app.use(express.json());

// Dummy POST endpoint
app.post('/submit', (req: Request, res: Response) => {
  const dummyJobId = 'job-12345';
  res.status(202).json({
    message: 'Job submitted successfully (Dummy)',
    jobId: dummyJobId,
    status: 'PENDING',
    redisHost: env.REDIS_HOST,
  });
});

// Dummy GET endpoint
app.get('/status/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    id,
    status: 'COMPLETED',
    result: 'Dummy output processing complete',
  });
});

app.listen(env.PORT, () => {
  console.log(`[Service A] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});
