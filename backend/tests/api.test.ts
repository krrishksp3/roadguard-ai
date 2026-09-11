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
    const testImageUrl = `/uploads/pothole_verified_test_${Date.now()}.jpg`;

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

    it('Acceptance 1: Unrelated ID-card/setup image + description "pothole" yields CANCELLED, NO RISK FOUND, hidden from Authority/Admin', async () => {
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

      const cancelledId = nonRoadRes.body.data.id;

      // Authority worklist must NOT include cancelled report
      const authList = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authorityToken}`);
      expect(authList.status).toBe(200);
      expect(authList.body.data.some((r: any) => r.id === cancelledId)).toBe(false);

      // Admin Overview must NOT include cancelled report
      const adminOverview = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminOverview.status).toBe(200);
      expect(adminOverview.body.data.criticalReports.some((r: any) => r.id === cancelledId)).toBe(false);

      // Citizen CAN see it in their own complaints
      const citizenReports = await request(app)
        .get('/api/reports/my')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(citizenReports.status).toBe(200);
      expect(citizenReports.body.data.some((r: any) => r.id === cancelledId)).toBe(true);
    });

    it('Acceptance 2: Unrelated person/chest image + description "pothole" yields CANCELLED, NO RISK FOUND', async () => {
      const personRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9810,
          longitude: 77.7010,
          address: 'Civil Lines, Meerut',
          description: 'pothole',
          imageFilename: 'person_chest_photo.jpg',
          imageUrl: '/uploads/person_chest_photo.jpg',
        });

      expect(personRes.status).toBe(201);
      expect(personRes.body.validRoadDamage).toBe(false);
      expect(personRes.body.status).toBe('CANCELLED');
      expect(personRes.body.data.riskScore).toBe(0);
    });

    it('TEST B & C: Chess, poster, QR code, religious images with description "pothole" are rejected as INVALID', async () => {
      const testCases = [
        { filename: 'chess_game_board.jpg', url: '/uploads/chess_game_board.jpg' },
        { filename: 'movie_poster_advertisement.png', url: '/uploads/movie_poster_advertisement.png' },
        { filename: 'payment_qr_code.png', url: '/uploads/payment_qr_code.png' },
        { filename: 'temple_idol_religious_photo.jpg', url: '/uploads/temple_idol_religious_photo.jpg' },
        { filename: 'classroom_product_interior.jpg', url: '/uploads/classroom_product_interior.jpg' },
      ];

      for (const tc of testCases) {
        const res = await request(app)
          .post('/api/reports')
          .set('Authorization', `Bearer ${citizenToken}`)
          .send({
            latitude: 28.9815,
            longitude: 77.7015,
            address: 'Civil Lines, Meerut',
            description: 'pothole', // User text says pothole, but image wins!
            imageFilename: tc.filename,
            imageUrl: tc.url,
          });

        expect(res.status).toBe(201);
        expect(res.body.validRoadDamage).toBe(false);
        expect(res.body.status).toBe('CANCELLED');
        expect(res.body.data.riskScore).toBe(0);
        expect(res.body.data.damageType).toBe('other');
        expect(res.body.data.departmentId).toBeNull();
      }
    });

    it('TEST J: Lifecycle enforcement blocks jumping directly to AI_VERIFIED or uploading repair photo on ASSIGNED report', async () => {
      // Create a fresh valid report
      const freshReport = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9870,
          longitude: 77.7070,
          address: 'Delhi Road, Meerut',
          description: 'Pothole on right lane',
          imageFilename: `pothole-lifecycle-test-${Date.now()}.jpg`,
          imageUrl: `/uploads/pothole-lifecycle-test-${Date.now()}.jpg`,
        });
      expect(freshReport.status).toBe(201);
      const freshId = freshReport.body.data.id;
      expect(freshReport.body.data.status).toBe('ASSIGNED');

      // Attempting to run repair verification directly on ASSIGNED report must be rejected
      const verifyAttempt = await request(app)
        .post('/api/verification/run')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          reportId: freshId,
          afterImageUrl: '/uploads/repaired-road.jpg',
        });
      expect(verifyAttempt.status).toBe(500); // Throws Lifecycle order violation error

      // Attempting to upload after-repair photo directly on ASSIGNED report must be rejected
      const afterAttempt = await request(app)
        .post(`/api/reports/${freshId}/after-photo`)
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          afterImageUrl: '/uploads/repaired-road.jpg',
        });
      expect(afterAttempt.status).toBe(400);
      expect(afterAttempt.body.message).toContain('Lifecycle order violation');
    });

    it('Acceptance 3, 4, 5: Genuine road-damage images (pothole, water-logging, surface-cracking) are VALID', async () => {
      // 3. Genuine Pothole
      const potholeRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9830,
          longitude: 77.7030,
          address: 'Delhi Road, Meerut',
          description: 'Dangerous pothole cavity on main carriage way',
          imageFilename: `pothole-deep-cavity-${Date.now()}.jpg`,
          imageUrl: `/uploads/pothole-deep-cavity-${Date.now()}.jpg`,
        });
      expect(potholeRes.status).toBe(201);
      expect(potholeRes.body.data.damageType).toBe('pothole');
      expect(potholeRes.body.data.status).toBe('ASSIGNED');
      expect(potholeRes.body.data.riskScore).toBeGreaterThan(0);

      // 4. Genuine Water Logging
      const waterlogRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9840,
          longitude: 77.7040,
          address: 'Surajkund Road, Meerut',
          description: 'Submerged road cavity and water ponding',
          imageFilename: `waterlogging-street-${Date.now()}.jpg`,
          imageUrl: `/uploads/waterlogging-street-${Date.now()}.jpg`,
        });
      expect(waterlogRes.status).toBe(201);
      expect(waterlogRes.body.data.damageType).toBe('waterlogging');
      expect(waterlogRes.body.data.status).toBe('ASSIGNED');
      expect(waterlogRes.body.data.riskScore).toBeGreaterThan(0);

      // 5. Genuine Surface Cracking
      const crackRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9850,
          longitude: 77.7050,
          address: 'Garh Road, Meerut',
          description: 'Alligator cracking and asphalt fatigue',
          imageFilename: `surface-cracking-lane-${Date.now()}.jpg`,
          imageUrl: `/uploads/surface-cracking-lane-${Date.now()}.jpg`,
        });
      expect(crackRes.status).toBe(201);
      expect(crackRes.body.data.damageType).toBe('crack');
      expect(crackRes.body.data.status).toBe('ASSIGNED');
      expect(crackRes.body.data.riskScore).toBeGreaterThan(0);
    });

    it('Acceptance 6, 7, 8: Duplicate detection (Case A, B, C) and deterministic risk baseline', async () => {
      const fixedImageUrl = `/uploads/verified_pothole_evidence_${Date.now()}.jpg`;
      const fixedFilename = `verified_pothole_evidence_${Date.now()}.jpg`;

      // First submission at Location 1 (Jail Chungi)
      const sub1 = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9835,
          longitude: 77.7425,
          address: 'Jail Chungi, Meerut',
          description: 'Pothole on lane',
          imageFilename: fixedFilename,
          imageUrl: fixedImageUrl,
        });
      expect(sub1.status).toBe(201);
      const report1Id = sub1.body.data.id;
      const report1Risk = sub1.body.data.riskScore;

      // Acceptance 6 (Case A): Same exact pothole image submitted twice at same location -> DUPLICATE
      const sub2 = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9836, // ~15 meters away
          longitude: 77.7426,
          address: 'Jail Chungi, Meerut',
          description: 'Pothole duplicate',
          imageFilename: fixedFilename,
          imageUrl: fixedImageUrl,
        });
      expect(sub2.status).toBe(200);
      expect(sub2.body.isDuplicate).toBe(true);
      expect(sub2.body.duplicateOfId).toBe(report1Id);

      // Acceptance 7 (Case B): Same exact pothole image submitted at a DIFFERENT location (> 2km away) -> NOT duplicate
      const sub3 = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 29.0100, // ~3km away
          longitude: 77.7800,
          address: 'Partapur Bypass, Meerut',
          description: 'Same defect photo reported for another spot',
          imageFilename: fixedFilename,
          imageUrl: fixedImageUrl,
        });
      expect(sub3.status).toBe(201);
      expect(sub3.body.data.id).not.toBe(report1Id);

      // Acceptance 8: Exact same image produces identical deterministic risk score
      expect(sub3.body.data.riskScore).toBe(report1Risk);
    });

    it('Acceptance 10: Unrelated After-Repair image produces REJECT / NEEDS_REINSPECTION and blocks formal closure', async () => {
      // 1. Run verification with unrelated after image
      const verifyRes = await request(app)
        .post('/api/verification/run')
        .set('Authorization', `Bearer ${authorityToken}`)
        .send({
          reportId,
          afterImageUrl: '/uploads/person_chest_unrelated.png',
        });
      expect(verifyRes.status).toBe(200);
      expect(['REJECT', 'NEEDS_REINSPECTION']).toContain(verifyRes.body.data.recommendation);
      expect(verifyRes.body.data.visibleImprovementScore).toBeLessThanOrEqual(5);
      expect(verifyRes.body.data.locationMatchConfidence).toBeLessThanOrEqual(5);

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
