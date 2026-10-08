// Service A: API Gateway / Job Submitter
import express, { Request, Response } from 'express';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env';

const app = express();
app.use(express.json());

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => console.log('[Service A] Connected to Redis'));
redis.on('error', (err) => console.error('[Service A] Redis error:', err));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// POST /submit -> Pushes job into Redis queue
app.post('/submit', async (req: Request, res: Response) => {
  try {
    const jobId = uuidv4();
    const payload = req.body || {};
    const jobData = { id: jobId, payload, createdAt: Date.now() };

    // Push job to list and save initial status in a hash
    await redis.lpush('job_queue', JSON.stringify(jobData));
    await redis.hset(`job:${jobId}`, {
      status: 'PENDING',
      createdAt: Date.now().toString(),
    });

    res.status(202).json({ jobId, status: 'PENDING' });
  } catch (err) {
    console.error('[Service A] Job submission failed:', err);
    res.status(500).json({ error: 'Failed to submit job to queue' });
  }
});

// GET /status/:id -> Poll job status and result
app.get('/status/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jobInfo = await redis.hgetall(`job:${id}`);

    if (!jobInfo || Object.keys(jobInfo).length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.status(200).json({ id, ...jobInfo });
  } catch (err) {
    console.error('[Service A] Status check failed:', err);
    res.status(500).json({ error: 'Failed to retrieve job status' });
  }
});

app.listen(env.PORT, () => {
  console.log(`[Service A] Running on port ${env.PORT}`);
});
