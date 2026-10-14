import express from 'express';
import { env } from './config/env';

const app = express();

// Dummy Health Check
app.get('/health', (req, res) => {
  res.send('Service B Worker Operational');
});

// Dummy Prometheus Metrics Endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP jobs_processed_total Total dummy jobs processed
# TYPE jobs_processed_total counter
jobs_processed_total 42
`);
});

// Dummy worker background loop
function mockWorkerLoop() {
  console.log(
    `[Service B] Worker initialized. Connected to Redis at ${env.REDIS_HOST}:${env.REDIS_PORT}`
  );
  setInterval(() => {
    console.log('[Service B] Polling queue... (Dummy execution)');
  }, 10000);
}

app.listen(env.PORT, () => {
  console.log(`[Service B] Metrics endpoint running on port ${env.PORT}`);
  mockWorkerLoop();
});
