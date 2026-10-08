// Service B: Worker (Scalable Service)
import express, { Request, Response } from 'express';
import Redis from 'ioredis';
import bcrypt from 'bcryptjs';
import client from 'prom-client';
import { env } from './config/env';

const app = express();
app.use(express.json());

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Prometheus Registry & Metrics Setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const jobsProcessedTotal = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed by workers',
  registers: [register],
});

const jobErrorsTotal = new client.Counter({
  name: 'job_errors_total',
  help: 'Total number of job processing failures',
  registers: [register],
});

const jobProcessingTimeSeconds = new client.Histogram({
  name: 'job_processing_time_seconds',
  help: 'Processing duration for jobs in seconds',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20],
  registers: [register],
});

// Heavy CPU Workload Functions
function calculatePrimes(max: number = 100000): number[] {
  const primes: number[] = [];
  for (let i = 2; i <= max; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }
  return primes;
}

function generateAndSortArray(size: number = 100000): number[] {
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * size));
  return arr.sort((a, b) => a - b);
}

async function performCpuHeavyTasks(): Promise<void> {
  // 1. Calculate primes up to 100,000
  calculatePrimes(100000);
  // 2. Bcrypt hashing (10 rounds)
  await bcrypt.hash('k8s-stress-test-payload', 10);
  // 3. Generate + sort array of 100,000 integers
  generateAndSortArray(100000);
}

// Redis Consumer Worker Loop
async function startWorker(): Promise<void> {
  console.log('[Service B] Worker initialized. Waiting for jobs in Redis...');

  while (true) {
    try {
      // Blocking pop from Redis queue (timeout: 0 = block indefinitely)
      const res = await redis.brpop('job_queue', 0);
      if (!res) continue;

      const [, rawData] = res;
      const job = JSON.parse(rawData);
      const endTimer = jobProcessingTimeSeconds.startTimer();

      await redis.hset(`job:${job.id}`, 'status', 'PROCESSING');

      // Execute CPU-intensive workload
      await performCpuHeavyTasks();

      const duration = endTimer();
      jobsProcessedTotal.inc();

      await redis.hset(`job:${job.id}`, {
        status: 'COMPLETED',
        completedAt: Date.now().toString(),
        durationSeconds: duration.toString(),
      });
    } catch (err) {
      jobErrorsTotal.inc();
      console.error('[Service B] Error during job execution:', err);
    }
  }
}

// Health and Readiness Probe Endpoints
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Prometheus Metrics Scraping Endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.listen(env.PORT, () => {
  console.log(`[Service B] Worker metrics API active on port ${env.PORT}`);
  startWorker();
});
