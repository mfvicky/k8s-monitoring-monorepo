import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock ioredis using a standard function constructor to support the 'new' keyword
vi.mock('ioredis', () => {
  return {
    default: function MockRedis() {
      return {
        on: vi.fn(),
        brpop: vi.fn().mockReturnValue(new Promise(() => {})), // Block loop during test
      };
    },
  };
});

import app from './index';

describe('Service B - Worker Metrics API', () => {
  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  it('GET /metrics should return Prometheus metrics format', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('jobs_processed_total');
  });
});
