import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';

describe('RoadGuard API Endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.platform || res.body.service).toContain('ROADGUARD AI');
  });

  it('GET /api/reports should return list of seeded reports', async () => {
    const res = await request(app).get('/api/reports');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/tenders should return public tender records', async () => {
    const res = await request(app).get('/api/tenders');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/road-health should return road segments with health scores', async () => {
    const res = await request(app).get('/api/road-health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
  });
});
