// Service C: Stats / Aggregator
import express, { Request, Response } from 'express';
import Redis from 'ioredis';
import client from 'prom-client';
import { env } from './config/env';

const app = express();
app.use(express.json());

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: 3,
});

// Prometheus Metrics Registry
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const queueLengthGauge = new client.Gauge({
  name: 'queue_length',
  help: 'Current number of jobs pending in the Redis queue',
  registers: [register],
});

const totalJobsSubmittedCounter = new client.Counter({
  name: 'total_jobs_submitted',
  help: 'Estimated total jobs submitted',
  registers: [register],
});

const totalJobsCompletedCounter = new client.Counter({
  name: 'total_jobs_completed',
  help: 'Estimated total jobs completed',
  registers: [register],
});

// Periodically sync Redis queue stats to Prometheus gauges
setInterval(async () => {
  try {
    const queueLength = await redis.llen('job_queue');
    queueLengthGauge.set(queueLength);
  } catch (err) {
    console.error('[Service C] Failed to fetch queue depth from Redis:', err);
  }
}, 3000);

// GET /stats -> JSON summary endpoint
app.get('/stats', async (_req: Request, res: Response) => {
  try {
    const queueLength = await redis.llen('job_queue');
    const keys = await redis.keys('job:*');

    let completedCount = 0;
    let pendingCount = 0;
    let processingCount = 0;

    for (const key of keys) {
      const status = await redis.hget(key, 'status');
      if (status === 'COMPLETED') completedCount++;
      else if (status === 'PENDING') pendingCount++;
      else if (status === 'PROCESSING') processingCount++;
    }

    res.status(200).json({
      queueLength,
      jobs: {
        totalTracked: keys.length,
        completed: completedCount,
        pending: pendingCount,
        processing: processingCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Service C] Error gathering stats:', err);
    res.status(500).json({ error: 'Failed to retrieve system statistics' });
  }
});

// Health Probe Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Prometheus Metrics Scraping Endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.listen(env.PORT, () => {
  console.log(`[Service C] Stats service active on port ${env.PORT}`);
});
