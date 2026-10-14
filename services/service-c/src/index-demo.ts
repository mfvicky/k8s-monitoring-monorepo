import express from 'express';
import { env } from './config/env';

const app = express();

// Dummy Stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    queueLength: 5,
    activeWorkers: 2,
    redisTarget: `${env.REDIS_HOST}:${env.REDIS_PORT}`,
    timestamp: new Date().toISOString(),
  });
});

// Dummy Prometheus Metrics Endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP queue_length Current depth of dummy job queue
# TYPE queue_length gauge
queue_length 5
`);
});

app.listen(env.PORT, () => {
  console.log(`[Service C] Stats service running on port ${env.PORT}`);
});
