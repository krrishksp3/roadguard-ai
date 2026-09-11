import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/prisma';

async function runE2EAcceptance() {
  console.log('\n======================================================');
  console.log('       ROADGUARD AI - E2E ACCEPTANCE TEST SUITE       ');
  console.log('======================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  function reportResult(name: string, passed: boolean, details: string) {
    if (passed) {
      console.log(`[PASS] ${name}\n       ${details}\n`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${name}\n       ${details}\n`);
      testsFailed++;
    }
  }

  try {
    // 0. Authenticate Citizen, Authority, Admin
    const citizenAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@roadguard.demo', password: 'citizen123' });
    const citizenToken = citizenAuth.body.data.token;

    const authorityAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: 'authority@roadguard.demo', password: 'authority123' });
    const authorityToken = authorityAuth.body.data.token;

    const adminAuth = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@roadguard.demo', password: 'admin123' });
    const adminToken = adminAuth.body.data.token;

    // ----------------------------------------------------
    // TEST 1 — INVALID NORMAL IMAGE (e.g. child photo / human photo)
    // ----------------------------------------------------
    console.log('--- EXECUTING TEST 1: INVALID NORMAL IMAGE ---');
    const test1Res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        latitude: 28.9835,
        longitude: 77.7425,
        address: 'Civil Lines, Meerut',
        description: 'Huge dangerous pothole deep cavity on road', // User claims pothole!
        imageFilename: 'normal_child_photo.jpg',
        imageUrl: '/uploads/normal_child_photo.jpg',
      });

    const test1CancelledId = test1Res.body.data?.id;
    const test1Status = test1Res.body.data?.status;
    const test1Valid = test1Res.body.validRoadDamage;
    const test1Risk = test1Res.body.data?.riskScore;

    // Verify it is NOT in Authority list
    const authList1 = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${authorityToken}`);
    const inAuth1 = authList1.body.data?.some((r: any) => r.id === test1CancelledId);

    // Verify it is NOT in Admin overview
    const adminOverview1 = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    const inAdminCrit1 = adminOverview1.body.data?.criticalReports?.some((r: any) => r.id === test1CancelledId);
    const inAdminOver1 = adminOverview1.body.data?.overdueReports?.some((r: any) => r.id === test1CancelledId);

    // Verify Citizen CAN see it in their reports
    const citizenMy1 = await request(app)
      .get('/api/reports/my')
      .set('Authorization', `Bearer ${citizenToken}`);
    const inCitizen1 = citizenMy1.body.data?.some((r: any) => r.id === test1CancelledId);

    const test1Passed =
      test1Res.status === 201 &&
      test1Valid === false &&
      test1Status === 'CANCELLED' &&
      test1Risk === 0 &&
      !inAuth1 &&
      !inAdminCrit1 &&
      !inAdminOver1 &&
      inCitizen1;

    reportResult(
      'TEST 1 — INVALID NORMAL IMAGE',
      test1Passed,
      `Status: ${test1Status}, validRoadDamage: ${test1Valid}, riskScore: ${test1Risk}, isolatedFromAuth: ${!inAuth1}, isolatedFromAdmin: ${!inAdminCrit1 && !inAdminOver1}, visibleToCitizen: ${inCitizen1}`
    );

    // ----------------------------------------------------
    // TEST 2 — GENUINE POTHOLE IMAGE
    // ----------------------------------------------------
    console.log('--- EXECUTING TEST 2: GENUINE POTHOLE IMAGE ---');
    const runTimestamp = Date.now();
    const genuinePotholeFilename = `large-road-pothole-${runTimestamp}.jpg`;
    const genuinePotholeUrl = `/uploads/demo/large-road-pothole-${runTimestamp}.jpg`;
    // Use unique coordinates per run to ensure clean first intake
    const test2Lat = 28.9800 + ((runTimestamp % 1000) / 100000);
    const test2Lng = 77.7400 + ((runTimestamp % 1000) / 100000);

    const test2Res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        latitude: test2Lat,
        longitude: test2Lng,
        address: 'Delhi Road Corridor, Meerut',
        description: 'Dangerous pothole cavity in asphalt surface',
        imageFilename: genuinePotholeFilename,
        imageUrl: genuinePotholeUrl,
      });

    const test2Id = test2Res.body.data?.id;
    const test2Status = test2Res.body.data?.status;
    const test2Valid = test2Res.body.validRoadDamage;
    const test2Risk = test2Res.body.data?.riskScore;
    const test2DamageType = test2Res.body.data?.damageType;
    const test2Dept = test2Res.body.data?.departmentId;

    // Verify it IS in Authority list
    const authList2 = await request(app)
      .get(`/api/reports?search=${test2Id}`)
      .set('Authorization', `Bearer ${authorityToken}`);
    const inAuth2 = authList2.body.data?.some((r: any) => r.id === test2Id);

    // Verify it IS in Admin operational data
    const adminReport2 = await request(app)
      .get(`/api/reports/${test2Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const inAdmin2 = adminReport2.status === 200 && adminReport2.body.data?.id === test2Id;

    const test2Passed =
      test2Res.status === 201 &&
      test2Valid === true &&
      test2Status === 'ASSIGNED' &&
      test2Risk > 0 &&
      test2DamageType === 'pothole' &&
      !!test2Dept &&
      inAuth2 &&
      inAdmin2;

    reportResult(
      'TEST 2 — GENUINE POTHOLE IMAGE',
      test2Passed,
      `Status: ${test2Status}, validRoadDamage: ${test2Valid}, damageType: ${test2DamageType}, riskScore: ${test2Risk}, forwardedToAuthority: ${inAuth2}, visibleToAdmin: ${inAdmin2}`
    );

    // ----------------------------------------------------
    // TEST 3 — DUPLICATE GENUINE POTHOLE
    // ----------------------------------------------------
    console.log('--- EXECUTING TEST 3: DUPLICATE GENUINE POTHOLE ---');
    // Submit the exact same genuine pothole again at nearby location (<= 80m)
    const test3Res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        latitude: test2Lat + 0.0001, // ~11 meters away
        longitude: test2Lng + 0.0001,
        address: 'Delhi Road Corridor, Meerut',
        description: 'Duplicate report of same pothole',
        imageFilename: genuinePotholeFilename,
        imageUrl: genuinePotholeUrl,
      });

    const test3Id = test3Res.body.data?.id;
    const test3Status = test3Res.body.data?.status;
    const test3Valid = test3Res.body.validRoadDamage;
    const test3IsDuplicate = test3Res.body.isDuplicate;
    const test3DupOfId = test3Res.body.duplicateOfId;
    const test3Risk = test3Res.body.data?.riskScore;

    const test3Passed =
      test3Res.status === 200 &&
      test3Valid === true &&
      test3Status !== 'CANCELLED' &&
      test3Status === 'ASSIGNED' &&
      test3IsDuplicate === true &&
      test3DupOfId === test2Id &&
      test3Risk > 0;

    reportResult(
      'TEST 3 — DUPLICATE GENUINE POTHOLE',
      test3Passed,
      `validRoadDamage: ${test3Valid}, status: ${test3Status} (NOT CANCELLED), isDuplicate: ${test3IsDuplicate}, duplicateOfId: ${test3DupOfId} (matches primary: ${test2Id}), riskScore: ${test3Risk}`
    );

    // ----------------------------------------------------
    // TEST 4 — MULTIPLE UNRELATED IMAGES
    // ----------------------------------------------------
    console.log('--- EXECUTING TEST 4: MULTIPLE UNRELATED IMAGES ---');
    const unrelatedCases = [
      { name: 'normal person photo', filename: 'person_portrait.jpg', url: '/uploads/person_portrait.jpg' },
      { name: 'ID/card/document-like image', filename: 'student_id_card.png', url: '/uploads/student_id_card.png' },
      { name: 'cartoon/game/chess screenshot', filename: 'chess_game_board.png', url: '/uploads/chess_game_board.png' },
      { name: 'unrelated non-road image', filename: 'cat_pet_indoor.jpg', url: '/uploads/cat_pet_indoor.jpg' },
    ];

    let allUnrelatedPassed = true;
    const subResults: string[] = [];

    for (const uc of unrelatedCases) {
      const uRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          latitude: 28.9835,
          longitude: 77.7425,
          address: 'Civil Lines, Meerut',
          description: 'Pothole damaged road', // User claims road defect
          imageFilename: uc.filename,
          imageUrl: uc.url,
        });

      const uId = uRes.body.data?.id;
      const uValid = uRes.body.validRoadDamage;
      const uStatus = uRes.body.data?.status;
      const uRisk = uRes.body.data?.riskScore;

      // Verify isolated from authority
      const authListU = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${authorityToken}`);
      const inAuthU = authListU.body.data?.some((r: any) => r.id === uId);

      const casePass =
        uRes.status === 201 &&
        uValid === false &&
        uStatus === 'CANCELLED' &&
        uRisk === 0 &&
        !inAuthU;

      if (!casePass) allUnrelatedPassed = false;
      subResults.push(`${uc.name}: status=${uStatus}, validRoadDamage=${uValid}, risk=${uRisk}, isolated=${!inAuthU}`);
    }

    reportResult(
      'TEST 4 — MULTIPLE UNRELATED IMAGES',
      allUnrelatedPassed,
      subResults.join(' | ')
    );

    // ----------------------------------------------------
    // TEST 5 — EXISTING VALID DEMO REPORT
    // ----------------------------------------------------
    console.log('--- EXECUTING TEST 5: EXISTING VALID DEMO REPORT ---');
    // Fetch seeded reports
    const seededReports = await prisma.roadReport.findMany({
      where: { status: { not: 'CANCELLED' } },
      include: { aiAnalysis: true, priorityAssessment: true, department: true },
      take: 1,
    });

    const demoReport = seededReports[0];
    const hasAi = !!demoReport.aiAnalysis && demoReport.aiAnalysis.visibleDamage;
    const hasRisk = demoReport.riskScore > 0;

    // Check authority visibility (via search and direct report access)
    const authSearch5 = await request(app)
      .get(`/api/reports?search=${demoReport.id}`)
      .set('Authorization', `Bearer ${authorityToken}`);
    const inAuth5 = authSearch5.body.data?.some((r: any) => r.id === demoReport.id);

    // Check admin visibility
    const adminReport5 = await request(app)
      .get(`/api/reports/${demoReport.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const inAdmin5 = adminReport5.status === 200 && adminReport5.body.data?.id === demoReport.id;

    const test5Passed = hasAi && hasRisk && inAuth5 && inAdmin5;
    reportResult(
      'TEST 5 — EXISTING VALID DEMO REPORT',
      test5Passed,
      `Report ID: ${demoReport.id}, damageType: ${demoReport.damageType}, riskScore: ${demoReport.riskScore}, visibleInAuthority: ${inAuth5}, visibleInAdmin: ${inAdmin5}`
    );

    // ----------------------------------------------------
    // TEST 6 — AUTHORITY LIFECYCLE
    // ----------------------------------------------------
    console.log('--- EXECUTING TEST 6: AUTHORITY LIFECYCLE ---');
    // Verify valid report cannot jump directly to AI_VERIFIED or RESOLVED
    const jumpAttempt = await request(app)
      .post('/api/verification/run')
      .set('Authorization', `Bearer ${authorityToken}`)
      .send({
        reportId: test2Id,
        afterImageUrl: '/uploads/demo/repaired-road-patch.jpg',
      });

    // Verification must throw/reject lifecycle order violation because status is ASSIGNED
    const directVerifyBlocked = jumpAttempt.status === 500 || jumpAttempt.status === 400;

    // Now follow the genuine sequential lifecycle:
    // 1. Acknowledged
    const ackRes = await request(app)
      .patch(`/api/reports/${test2Id}/status`)
      .set('Authorization', `Bearer ${authorityToken}`)
      .send({ status: 'ACKNOWLEDGED', notes: 'Officer acknowledged complaint' });
    const isAck = ackRes.status === 200 && ackRes.body.data?.status === 'ACKNOWLEDGED';

    // 2. Field Inspection
    const inspRes = await request(app)
      .patch(`/api/reports/${test2Id}/status`)
      .set('Authorization', `Bearer ${authorityToken}`)
      .send({ status: 'INSPECTION_SCHEDULED', notes: 'Field inspection scheduled' });
    const isInsp = inspRes.status === 200 && inspRes.body.data?.status === 'INSPECTION_SCHEDULED';

    // 3. Repair in Progress
    const repRes = await request(app)
      .patch(`/api/reports/${test2Id}/status`)
      .set('Authorization', `Bearer ${authorityToken}`)
      .send({ status: 'REPAIR_IN_PROGRESS', notes: 'Contractor mobilized hot-mix asphalt' });
    const isRep = repRes.status === 200 && repRes.body.data?.status === 'REPAIR_IN_PROGRESS';

    // 4. Upload After-Repair Photo (Only allowed in repair progress)
    const afterPhotoRes = await request(app)
      .post(`/api/reports/${test2Id}/after-photo`)
      .set('Authorization', `Bearer ${authorityToken}`)
      .send({
        afterImageUrl: '/uploads/demo/repaired-road-patch.jpg',
        notes: 'Cold mix patch laid and roller compacted',
      });
    const isAfterUploaded = afterPhotoRes.status === 200;

    // 5. AI Repair Verification Audit
    const auditRes = await request(app)
      .post('/api/verification/run')
      .set('Authorization', `Bearer ${authorityToken}`)
      .send({
        reportId: test2Id,
        afterImageUrl: '/uploads/demo/repaired-road-patch.jpg',
      });
    const isAiVerified = auditRes.status === 200 && auditRes.body.data?.recommendation === 'PASS';

    // 6. Authority Formal Sign-Off -> RESOLVED
    const resolveRes = await request(app)
      .post(`/api/verification/${test2Id}/decision`)
      .set('Authorization', `Bearer ${authorityToken}`)
      .send({
        decision: 'APPROVED',
        notes: 'Executive Engineer verified pavement overlay quality on-site',
      });
    const isResolved = resolveRes.status === 200 && resolveRes.body.data?.report?.status === 'RESOLVED';

    const test6Passed = directVerifyBlocked && isAck && isInsp && isRep && isAfterUploaded && isAiVerified && isResolved;

    reportResult(
      'TEST 6 — AUTHORITY LIFECYCLE',
      test6Passed,
      `Direct Jump Blocked: ${directVerifyBlocked} -> Acknowledged: ${isAck} -> Inspection: ${isInsp} -> Repair In Progress: ${isRep} -> After Photo: ${isAfterUploaded} -> AI Verified: ${isAiVerified} -> Resolved: ${isResolved}`
    );

    // ----------------------------------------------------
    // FINAL VERIFICATION SUMMARY
    // ----------------------------------------------------
    console.log('======================================================');
    console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
    console.log('======================================================\n');

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runE2EAcceptance();
