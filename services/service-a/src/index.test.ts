import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock ioredis using a standard function constructor to support the 'new' keyword
vi.mock('ioredis', () => {
  return {
    default: function MockRedis() {
      return {
        on: vi.fn(),
        lpush: vi.fn().mockResolvedValue(1),
        hset: vi.fn().mockResolvedValue(1),
        hgetall: vi.fn().mockResolvedValue({ status: 'PENDING', createdAt: '1728000000000' }),
      };
    },
  };
});

import app from './index';

describe('Service A - API Gateway', () => {
  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('POST /submit should accept job and return 202 status with jobId', async () => {
    const res = await request(app).post('/submit').send({ payload: 'test-payload' });

    expect(res.status).toBe(202);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body.status).toBe('PENDING');
  });

  it('GET /status/:id should retrieve job status', async () => {
    const res = await request(app).get('/status/123-abc');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'PENDING');
  });
});
