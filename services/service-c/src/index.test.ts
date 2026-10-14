import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock ioredis using a standard function constructor to support the 'new' keyword
vi.mock('ioredis', () => {
  return {
    default: function MockRedis() {
      return {
        on: vi.fn(),
        llen: vi.fn().mockResolvedValue(5),
        keys: vi.fn().mockResolvedValue(['job:1', 'job:2']),
        hget: vi.fn().mockResolvedValue('COMPLETED'),
      };
    },
  };
});

import app from './index';

describe('Service C - Stats & Aggregator API', () => {
  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('GET /stats should return JSON summary of queue and jobs', async () => {
    const res = await request(app).get('/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('queueLength', 5);
    expect(res.body).toHaveProperty('jobs');
    expect(res.body.jobs.totalTracked).toBe(2);
  });

  it('GET /metrics should return Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('queue_length');
  });
});
