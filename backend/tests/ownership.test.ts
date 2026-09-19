import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';

describe('ROADGUARD AI — Citizen Report Ownership & Data Isolation', () => {
  let arunToken: string;
  let arunId: string;
  let krishnaToken: string;
  let krishnaId: string;
  let newCitizenToken: string;
  let newCitizenId: string;
  let authorityToken: string;

  let arunReportId: string;
  let newCitizenReportId: string;

  beforeAll(async () => {
    // 1. Authenticate Arun Kumar (existing citizen)
    const arunLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@roadguard.demo', password: 'citizen123' });
    expect(arunLogin.status).toBe(200);
    arunToken = arunLogin.body.data.token;
    arunId = arunLogin.body.data.user.id;

    // 2. Register/Login Krishna Kashyap (second citizen)
    const krishnaEmail = `krishna_${Date.now()}@test.demo`;
    const krishnaReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Krishna Kashyap',
        email: krishnaEmail,
        password: 'password123',
        role: 'CITIZEN',
      });
    expect(krishnaReg.status).toBe(201);
    krishnaToken = krishnaReg.body.data.token;
    krishnaId = krishnaReg.body.data.user.id;

    // 3. Register brand-new citizen
    const newCitizenEmail = `newcitizen_${Date.now()}@test.demo`;
    const newReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Citizen 3',
        email: newCitizenEmail,
        password: 'password123',
        role: 'CITIZEN',
      });
    expect(newReg.status).toBe(201);
    newCitizenToken = newReg.body.data.token;
    newCitizenId = newReg.body.data.user.id;

    // 4. Authenticate Authority
    const authLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'authority@roadguard.demo', password: 'authority123' });
    expect(authLogin.status).toBe(200);
    authorityToken = authLogin.body.data.token;
  });

  afterAll(async () => {
    // Clean up created test users and all their reports / notifications
    const userIds = [krishnaId, newCitizenId].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.statusTimelineEvent.deleteMany({ where: { report: { userId: { in: userIds } } } });
      await prisma.aIAnalysis.deleteMany({ where: { report: { userId: { in: userIds } } } });
      await prisma.priorityAssessment.deleteMany({ where: { report: { userId: { in: userIds } } } });
      await prisma.roadReport.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  // TEST 1: Login as Arun. Record the IDs visible in My Reports. Expected: only Arun-owned reports.
  it('TEST 1: Arun sees ONLY Arun-owned reports in My Reports', async () => {
    const res = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${arunToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Verify all returned reports belong strictly to Arun's user ID (or seeded demo user-citizen-01)
    for (const report of res.body.data) {
      expect([arunId, 'user-citizen-01']).toContain(report.userId);
    }

    arunReportId = res.body.data[0].id;
  });

  // TEST 2: Logout / Login as Krishna. Expected: only Krishna-owned reports (0 if newly created).
  it('TEST 2: Krishna Kashyap sees 0 reports initially in My Reports', async () => {
    const res = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${krishnaToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  // TEST 3: Create a completely new Citizen account. Login as new Citizen.
  it('TEST 3: Brand new Citizen account starts with 0 reports (No Arun reports, No Krishna reports)', async () => {
    const res = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${newCitizenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  // TEST 4: Submit one new valid report as the new Citizen. Expected: exactly 1 report in My Reports.
  it('TEST 4: Submitting a valid report as the new Citizen increases their My Reports count to 1', async () => {
    const submitRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${newCitizenToken}`)
      .send({
        imageUrl: '/demo-evidence/pothole-reference.jpg',
        imageFilename: 'pothole-reference.jpg',
        damageTypeHint: 'pothole',
        latitude: 28.8500,
        longitude: 77.5500,
        description: 'Deep hazardous crater near crossing',
        evidenceSource: 'USER_UPLOADED',
      });

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    newCitizenReportId = submitRes.body.data.id;
    expect(submitRes.body.data.userId).toBe(newCitizenId);

    // Verify My Reports now shows exactly 1 report
    const myReportsRes = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${newCitizenToken}`);

    expect(myReportsRes.status).toBe(200);
    expect(myReportsRes.body.data.length).toBe(1);
    expect(myReportsRes.body.data[0].id).toBe(newCitizenReportId);
    expect(myReportsRes.body.data[0].userId).toBe(newCitizenId);
  });

  // TEST 5: Logout and login as Arun. Expected: Arun still cannot see the new Citizen's report.
  it('TEST 5: Arun Kumar does not see the new Citizen report', async () => {
    const res = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${arunToken}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((r: any) => r.id);
    expect(ids).not.toContain(newCitizenReportId);
  });

  // TEST 6: Try to access another Citizen's report directly using its report ID while authenticated as a different Citizen.
  it('TEST 6: Accessing another Citizen report directly by ID returns 403 Forbidden', async () => {
    // Krishna tries to directly access Arun's report
    const crossAccessArun = await request(app)
      .get(`/api/reports/${arunReportId}`)
      .set('Authorization', `Bearer ${krishnaToken}`);

    expect(crossAccessArun.status).toBe(403);
    expect(crossAccessArun.body.success).toBe(false);
    expect(crossAccessArun.body.message).toContain('Access denied');

    // Arun tries to directly access newCitizen's report
    const crossAccessNew = await request(app)
      .get(`/api/reports/${newCitizenReportId}`)
      .set('Authorization', `Bearer ${arunToken}`);

    expect(crossAccessNew.status).toBe(403);
    expect(crossAccessNew.body.success).toBe(false);

    // Owner can access their own report directly
    const ownerAccess = await request(app)
      .get(`/api/reports/${newCitizenReportId}`)
      .set('Authorization', `Bearer ${newCitizenToken}`);

    expect(ownerAccess.status).toBe(200);
    expect(ownerAccess.body.success).toBe(true);
    expect(ownerAccess.body.data.id).toBe(newCitizenReportId);
  });

  // TEST 7: Login as Authority/Admin. Expected: Existing Authority/Admin report visibility and workflow continue working.
  it('TEST 7: Authority can view all reports including newCitizen report and arunReport', async () => {
    const authReportView = await request(app)
      .get(`/api/reports/${newCitizenReportId}`)
      .set('Authorization', `Bearer ${authorityToken}`);

    expect(authReportView.status).toBe(200);
    expect(authReportView.body.success).toBe(true);
    expect(authReportView.body.data.id).toBe(newCitizenReportId);

    const authAllReports = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${authorityToken}`);

    expect(authAllReports.status).toBe(200);
    expect(authAllReports.body.data.length).toBeGreaterThan(0);
  });

  // TEST 8: Verify duplicate detection still works:
  // Citizen A and Citizen B can report the same physical road issue, and the system may cluster them,
  // BUT each Citizen's My Reports remains isolated.
  it('TEST 8: Duplicate reporting clusters reports but maintains strictly isolated My Reports', async () => {
    // Krishna reports at the exact same location as newCitizen (<80m)
    const krishnaDuplicateSubmit = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${krishnaToken}`)
      .send({
        imageUrl: '/demo-evidence/pothole-reference.jpg',
        imageFilename: 'pothole-reference.jpg',
        damageTypeHint: 'pothole',
        latitude: 28.8500,
        longitude: 77.5500,
        description: 'Same pothole reported by Krishna',
        evidenceSource: 'USER_UPLOADED',
      });

    expect([200, 201]).toContain(krishnaDuplicateSubmit.status);
    const krishnaReportId = krishnaDuplicateSubmit.body.data.id;
    expect(krishnaDuplicateSubmit.body.data.userId).toBe(krishnaId);
    expect(krishnaDuplicateSubmit.body.data.isDuplicate).toBe(true);
    expect(krishnaDuplicateSubmit.body.data.duplicateOfId).toBe(newCitizenReportId);

    // Krishna's My Reports has ONLY Krishna's report (1 item)
    const krishnaMyReports = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${krishnaToken}`);

    expect(krishnaMyReports.status).toBe(200);
    expect(krishnaMyReports.body.data.length).toBe(1);
    expect(krishnaMyReports.body.data[0].id).toBe(krishnaReportId);

    // NewCitizen's My Reports STILL has ONLY NewCitizen's report (1 item)
    const newCitizenMyReports = await request(app)
      .get('/api/reports/my-reports')
      .set('Authorization', `Bearer ${newCitizenToken}`);

    expect(newCitizenMyReports.status).toBe(200);
    expect(newCitizenMyReports.body.data.length).toBe(1);
    expect(newCitizenMyReports.body.data[0].id).toBe(newCitizenReportId);

    // Cleanup Krishna report
    await prisma.statusTimelineEvent.deleteMany({ where: { reportId: krishnaReportId } });
    await prisma.aIAnalysis.deleteMany({ where: { reportId: krishnaReportId } });
    await prisma.priorityAssessment.deleteMany({ where: { reportId: krishnaReportId } });
    await prisma.roadReport.deleteMany({ where: { id: krishnaReportId } });
  });
});
