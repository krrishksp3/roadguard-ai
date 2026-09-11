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

  describe('Verification: Login for Citizen, Authority, Admin', () => {
    it('should authenticate Citizen, Authority and Admin with proper roles', async () => {
      const citizen = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@roadguard.demo', password: 'citizen123' });
      expect(citizen.status).toBe(200);
      expect(citizen.body.data.user.role).toBe('CITIZEN');

      const authority = await request(app)
        .post('/api/auth/login')
        .send({ email: 'authority@roadguard.demo', password: 'authority123' });
      expect(authority.status).toBe(200);
      expect(authority.body.data.user.role).toBe('AUTHORITY');
      expect(authority.body.data.user.departmentName).toContain('PWD');

      const admin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@roadguard.demo', password: 'admin123' });
      expect(admin.status).toBe(200);
      expect(admin.body.data.user.role).toBe('ADMIN');
    });
  });

  describe('Verification: End-to-End Report, Image, Authority & Admin Connections', () => {
    let citizenToken: string;
    let authorityToken: string;
    let adminToken: string;
    let reportId: string;
    const testImageUrl = '/uploads/pothole_verified_test.jpg';

    beforeAll(async () => {
      const cRes = await request(app).post('/api/auth/login').send({ email: 'citizen@roadguard.demo', password: 'citizen123' });
      citizenToken = cRes.body.data.token;

      const aRes = await request(app).post('/api/auth/login').send({ email: 'authority@roadguard.demo', password: 'authority123' });
      authorityToken = aRes.body.data.token;

      const admRes = await request(app).post('/api/auth/login').send({ email: 'admin@roadguard.demo', password: 'admin123' });
      adminToken = admRes.body.data.token;
    });

    it('Citizen creates report -> saved in DB -> Authority sees SAME report & BEFORE image -> Admin sees SAME report', async () => {
      const createRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9845,
          longitude: 77.7064,
          address: 'Delhi Road, Meerut',
          description: 'Deep hazardous pothole near metro junction',
          imageUrl: testImageUrl,
          damageType: 'pothole',
          severity: 'HIGH'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.id).toBeDefined();
      reportId = createRes.body.data.id;
      expect(createRes.body.data.imageUrl).toBe(testImageUrl);

      // Authority sees the exact same report and before image
      const authRes = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${authorityToken}`);
      expect(authRes.status).toBe(200);
      expect(authRes.body.data.id).toBe(reportId);
      expect(authRes.body.data.imageUrl).toBe(testImageUrl);

      // Admin sees the exact same report and before image
      const adminRes = await request(app)
        .get(`/api/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.id).toBe(reportId);
      expect(adminRes.body.data.imageUrl).toBe(testImageUrl);
    });

    it('Authority performs full action lifecycle: Acknowledge, Schedule, Mobilize, After-Photo, AI Audit', async () => {
      // 1. Acknowledge
      const ackRes = await request(app)
        .patch(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({ status: 'ACKNOWLEDGED', notes: 'Complaint acknowledged by PWD' });
      expect(ackRes.status).toBe(200);
      expect(ackRes.body.data.status).toBe('ACKNOWLEDGED');

      // 2. Schedule inspection
      const schedRes = await request(app)
        .patch(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({ status: 'INSPECTION_SCHEDULED', notes: 'Inspection scheduled' });
      expect(schedRes.status).toBe(200);
      expect(schedRes.body.data.status).toBe('INSPECTION_SCHEDULED');

      // 3. Mobilize Repair / In Progress
      const mobRes = await request(app)
        .patch(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({ status: 'REPAIR_IN_PROGRESS', notes: 'Repair team on-site' });
      expect(mobRes.status).toBe(200);
      expect(mobRes.body.data.status).toBe('REPAIR_IN_PROGRESS');

      // 4. Upload After-Repair Photo
      const afterRes = await request(app)
        .post(`/api/reports/${reportId}/after-photo`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          afterImageUrl: '/uploads/after_repair_pothole_done.jpg',
          notes: 'Hot-mix bituminous concrete applied and compacted'
        });
      expect(afterRes.status).toBe(200);
      expect(afterRes.body.data.repairAfterImageUrl).toBe('/uploads/after_repair_pothole_done.jpg');

      // 5. Run Repair Audit
      const auditRes = await request(app)
        .post('/api/verification/run')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          reportId,
          afterImageUrl: '/uploads/after_repair_pothole_done.jpg'
        });
      expect(auditRes.status).toBe(200);
      expect(auditRes.body.data.recommendation).toBeDefined();
      expect(auditRes.body.data.visibleImprovementScore).toBeGreaterThan(0);
    });

    it('Authority escalates to Admin & Admin Takes Action', async () => {
      // Authority escalates
      const escRes = await request(app)
        .post(`/api/reports/${reportId}/escalate`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({ reason: 'Contractor delayed execution beyond target hours' });
      expect(escRes.status).toBe(200);
      const hasEscalatedTimeline = escRes.body.data.timeline.some((e: any) => e.label.includes('Escalated'));
      expect(hasEscalatedTimeline).toBe(true);

      // Admin Overview sees escalation
      const ovRes = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(ovRes.status).toBe(200);
      expect(ovRes.body.data.stats.escalatedCount).toBeGreaterThanOrEqual(1);

      // Admin Takes Action
      const actRes = await request(app)
        .post('/api/admin/action')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId,
          actionType: 'DIRECTIVE_NOTICE',
          notes: 'Formal notice issued to Chief Engineer to complete patching within 24h'
        });
      expect(actRes.status).toBe(200);
      expect(actRes.body.success).toBe(true);
    });

    it('Non-road image with description "pothole" yields CANCELLED, NO RISK FOUND, and is hidden from Authority and Admin', async () => {
      const nonRoadRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9800,
          longitude: 77.7000,
          address: 'Civil Lines, Meerut',
          description: 'pothole',
          imageFilename: 'student_id_card.png',
          imageUrl: '/uploads/student_id_card.png',
        });

      expect(nonRoadRes.status).toBe(201);
      expect(nonRoadRes.body.validRoadDamage).toBe(false);
      expect(nonRoadRes.body.status).toBe('CANCELLED');
      expect(nonRoadRes.body.data.riskScore).toBe(0);
      expect(nonRoadRes.body.data.status).toBe('CANCELLED');

      const cancelledId = nonRoadRes.body.data.id;

      // Authority worklist must NOT include cancelled report
      const authList = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authorityToken}`);
      expect(authList.status).toBe(200);
      const inAuthList = authList.body.data.some((r: any) => r.id === cancelledId);
      expect(inAuthList).toBe(false);

      // Admin Overview must NOT include cancelled report
      const adminOverview = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminOverview.status).toBe(200);
      const inCritical = adminOverview.body.data.criticalReports.some((r: any) => r.id === cancelledId);
      const inOverdue = adminOverview.body.data.overdueReports.some((r: any) => r.id === cancelledId);
      expect(inCritical).toBe(false);
      expect(inOverdue).toBe(false);

      // Citizen CAN see it in their own complaints
      const citizenReports = await request(app)
        .get('/api/reports/my')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(citizenReports.status).toBe(200);
      const inCitizenList = citizenReports.body.data.some((r: any) => r.id === cancelledId);
      expect(inCitizenList).toBe(true);
    });

    it('Unrelated After-Repair image produces NEEDS_REINSPECTION and blocks formal closure', async () => {
      // 1. Run verification with unrelated after image
      const verifyRes = await request(app)
        .post('/api/verification/run')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          reportId,
          afterImageUrl: '/uploads/id_card_unrelated.png',
        });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.recommendation).toBe('NEEDS_REINSPECTION');
      expect(verifyRes.body.data.visibleImprovementScore).toBeLessThan(40);

      // 2. Attempting to approve must be blocked
      const blockedRes = await request(app)
        .post(`/api/verification/${reportId}/decision`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          decision: 'APPROVED',
          notes: 'Attempting closure with mismatched evidence'
        });
      expect(blockedRes.status).toBe(400);
      expect(blockedRes.body.message).toContain('Formal closure blocked');
    });

    it('Valid After-Repair image produces PASS and allows formal closure', async () => {
      // 1. Re-verify with genuine repaired road photo
      const verifyPassRes = await request(app)
        .post('/api/verification/run')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          reportId,
          afterImageUrl: '/uploads/repaired-road-patch.jpg',
        });
      expect(verifyPassRes.status).toBe(200);
      expect(verifyPassRes.body.data.recommendation).toBe('PASS');

      // 2. Approve & Formally Close Complaint
      const closeRes = await request(app)
        .post(`/api/verification/${reportId}/decision`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          decision: 'APPROVED',
          officialNotes: 'Verified on-site by Executive Engineer, overlay fully confirmed.'
        });

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.report.status).toBe('RESOLVED');
      const hasResolvedTimeline = closeRes.body.data.report.timeline.some((e: any) => e.status === 'RESOLVED');
      expect(hasResolvedTimeline).toBe(true);
    });
  });
});
