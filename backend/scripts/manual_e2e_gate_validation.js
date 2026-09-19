const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../dist/app').default;
const { prisma } = require('../dist/config/prisma');

async function runValidation() {
  console.log('================================================================');
  console.log('ROADGUARD AI — REAL MANUAL END-TO-END GATE VALIDATION');
  console.log('================================================================\n');

  // Step 0: Authenticate Citizen and Authority
  console.log('Step 0: Authenticating users...');
  const citizenLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'citizen@roadguard.demo', password: 'citizen123' });
  if (citizenLoginRes.status !== 200) {
    throw new Error('Citizen login failed: ' + JSON.stringify(citizenLoginRes.body));
  }
  const citizenToken = citizenLoginRes.body.data.token;
  const citizenUser = citizenLoginRes.body.data.user;
  console.log(`✓ Citizen authenticated: ${citizenUser.name} (${citizenUser.email})`);

  const authorityLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'authority@roadguard.demo', password: 'authority123' });
  if (authorityLoginRes.status !== 200) {
    throw new Error('Authority login failed: ' + JSON.stringify(authorityLoginRes.body));
  }
  const authorityToken = authorityLoginRes.body.data.token;
  const authorityUser = authorityLoginRes.body.data.user;
  console.log(`✓ Authority authenticated: ${authorityUser.name} (${authorityUser.departmentName})\n`);

  // ================================================================
  // CASE 1: Normal Intact Road / Vehicle Scene with Pothole Claim
  // ================================================================
  console.log('----------------------------------------------------------------');
  console.log('CASE 1: Normal Intact Road / Vehicle Scene (Citizen claims Pothole)');
  console.log('----------------------------------------------------------------');

  // Prepare normal road image file
  const normalRoadSrc = path.resolve(__dirname, '../uploads/evidence-1789166146961-27aaf5ad.jpg');
  const normalRoadTmp = path.resolve(__dirname, '../uploads/normal_intact_road_traffic_scene.jpg');
  fs.copyFileSync(normalRoadSrc, normalRoadTmp);

  // Upload image via POST /api/upload
  console.log('Uploading normal road photograph to POST /api/upload...');
  const upload1Res = await request(app)
    .post('/api/uploads')
    .attach('photo', normalRoadTmp);

  if (upload1Res.status !== 201 && upload1Res.status !== 200) {
    throw new Error('Upload 1 failed (' + upload1Res.status + '): ' + JSON.stringify(upload1Res.body));
  }
  const upload1Data = upload1Res.body.data;
  console.log(`✓ Upload successful: url=${upload1Data.url}, filename=${upload1Data.filename}`);

  // Submit report via POST /api/reports
  console.log('\nSubmitting Citizen Report via POST /api/reports:');
  console.log('  Category: Pothole');
  console.log('  Description: "Large pothole on road"');
  console.log('  Image: normal_intact_road_traffic_scene.jpg');

  const report1Res = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      latitude: 28.9815,
      longitude: 77.7015,
      address: 'Civil Lines, Meerut',
      damageType: 'pothole', // User enters Category: Pothole
      description: 'Large pothole on road', // User enters Description: Large pothole on road
      imageFilename: upload1Data.filename,
      imageUrl: upload1Data.url,
    });

  console.log(`\nHTTP Response Status: ${report1Res.status}`);
  console.log('Response Body Summary:');
  console.log({
    success: report1Res.body.success,
    damageDetected: report1Res.body.damageDetected,
    validRoadDamage: report1Res.body.validRoadDamage,
    classification: report1Res.body.classification,
    damageType: report1Res.body.damageType,
    priority: report1Res.body.priority,
    severity: report1Res.body.severity,
    safetyRisk: report1Res.body.safetyRisk,
    riskScore: report1Res.body.riskScore,
    status: report1Res.body.status,
    evidenceReason: report1Res.body.evidenceReason,
    message: report1Res.body.message,
  });

  const report1Id = report1Res.body.data.id;

  // Query Database Record
  const dbReport1 = await prisma.roadReport.findUnique({
    where: { id: report1Id },
    include: { aiAnalysis: true, priorityAssessment: true },
  });

  console.log('\nDatabase Record Verification:');
  console.log(`  Report ID: ${dbReport1.id}`);
  console.log(`  Status: ${dbReport1.status}`);
  console.log(`  Risk Score: ${dbReport1.riskScore}`);
  console.log(`  Department ID: ${dbReport1.departmentId}`);
  console.log(`  Road Segment ID: ${dbReport1.roadSegmentId}`);
  console.log(`  SLA Target Hours: ${dbReport1.slaTargetHours}`);
  console.log(`  AI Damage Detected: ${dbReport1.aiAnalysis?.visibleDamage}`);
  console.log(`  AI Description: ${dbReport1.aiAnalysis?.description}`);

  // Query Authority Operational Queue
  console.log('\nQuerying Authority Operational Queue (GET /api/reports):');
  const authQueueRes1 = await request(app)
    .get('/api/reports')
    .set('Authorization', `Bearer ${authorityToken}`);

  const inAuthQueue1 = authQueueRes1.body.data.some((r) => r.id === report1Id);
  console.log(`  Report in Authority Queue: ${inAuthQueue1} (Expected: false)`);

  // Query Citizen "My Reports"
  console.log('Querying Citizen My Reports (GET /api/reports/my-reports):');
  const citizenReportsRes1 = await request(app)
    .get('/api/reports/my-reports')
    .set('Authorization', `Bearer ${citizenToken}`);

  const inCitizenReports1 = citizenReportsRes1.body.data.some((r) => r.id === report1Id);
  console.log(`  Report in Citizen My Reports: ${inCitizenReports1} (Expected: true)`);

  // Assertions for Case 1
  const case1Success =
    report1Res.body.validRoadDamage === false &&
    report1Res.body.damageDetected === false &&
    report1Res.body.classification === 'NO_DAMAGE_FOUND' &&
    report1Res.body.riskScore === 0 &&
    report1Res.body.priority === 'NONE' &&
    report1Res.body.status === 'CANCELLED' &&
    dbReport1.departmentId === null &&
    dbReport1.roadSegmentId === null &&
    dbReport1.slaTargetHours === 0 &&
    inAuthQueue1 === false &&
    inCitizenReports1 === true;

  console.log(`\n>>> CASE 1 RESULT: ${case1Success ? 'PASSED (STRICT GATE ENFORCED)' : 'FAILED'} <<<\n`);

  // ================================================================
  // CASE 2: Genuine Road-Damage Photograph
  // ================================================================
  console.log('----------------------------------------------------------------');
  console.log('CASE 2: Genuine Road-Damage Photograph (Pothole Reference Asset)');
  console.log('----------------------------------------------------------------');

  const genuinePotholeSrc = path.resolve(__dirname, '../../frontend/public/demo-evidence/pothole-reference.jpg');

  // Upload image via POST /api/upload
  console.log('Uploading genuine pothole photograph to POST /api/upload...');
  const upload2Res = await request(app)
    .post('/api/uploads')
    .attach('photo', genuinePotholeSrc);

  if (upload2Res.status !== 201 && upload2Res.status !== 200) {
    throw new Error('Upload 2 failed (' + upload2Res.status + '): ' + JSON.stringify(upload2Res.body));
  }
  const upload2Data = upload2Res.body.data;
  console.log(`✓ Upload successful: url=${upload2Data.url}, filename=${upload2Data.filename}`);

  // Submit report via POST /api/reports
  console.log('\nSubmitting Citizen Report via POST /api/reports:');
  console.log('  Category: Pothole');
  console.log('  Description: "Severe deep pothole causing traffic obstruction"');
  console.log('  Image: pothole-reference.jpg');

  const report2Res = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      latitude: 28.9870,
      longitude: 77.7070,
      address: 'Delhi Road, Meerut',
      damageType: 'pothole',
      description: 'Severe deep pothole causing traffic obstruction',
      imageFilename: upload2Data.filename,
      imageUrl: upload2Data.url,
    });

  console.log(`\nHTTP Response Status: ${report2Res.status}`);
  console.log('Response Body Summary:');
  console.log({
    success: report2Res.body.success,
    damageDetected: report2Res.body.data.aiAnalysis?.visibleDamage,
    validRoadDamage: report2Res.body.validRoadDamage,
    classification: report2Res.body.classification,
    damageType: report2Res.body.data.damageType,
    severity: report2Res.body.data.severity,
    riskScore: report2Res.body.data.riskScore,
    status: report2Res.body.data.status,
    department: report2Res.body.data.department?.name,
    roadSegment: report2Res.body.data.roadSegment?.name,
  });

  const report2Id = report2Res.body.data.id;

  // Query Database Record
  const dbReport2 = await prisma.roadReport.findUnique({
    where: { id: report2Id },
    include: { aiAnalysis: true, priorityAssessment: true, department: true, roadSegment: true },
  });

  console.log('\nDatabase Record Verification:');
  console.log(`  Report ID: ${dbReport2.id}`);
  console.log(`  Status: ${dbReport2.status}`);
  console.log(`  Risk Score: ${dbReport2.riskScore}`);
  console.log(`  Department: ${dbReport2.department?.name} (${dbReport2.departmentId})`);
  console.log(`  Road Segment: ${dbReport2.roadSegment?.name} (${dbReport2.roadSegmentId})`);
  console.log(`  SLA Target Hours: ${dbReport2.slaTargetHours}`);
  console.log(`  AI Visible Damage: ${dbReport2.aiAnalysis?.visibleDamage}`);
  console.log(`  AI Damage Type: ${dbReport2.aiAnalysis?.damageType}`);
  console.log(`  Priority Overall Score: ${dbReport2.priorityAssessment?.overallScore}`);

  // Query Authority Operational Queue
  console.log('\nQuerying Authority Operational Queue (GET /api/reports):');
  const authQueueRes2 = await request(app)
    .get('/api/reports')
    .set('Authorization', `Bearer ${authorityToken}`);

  const inAuthQueue2 = authQueueRes2.body.data.some((r) => r.id === report2Id);
  console.log(`  Report in Authority Queue: ${inAuthQueue2} (Expected: true)`);

  // Assertions for Case 2
  const case2Success =
    report2Res.body.validRoadDamage === true &&
    dbReport2.aiAnalysis?.visibleDamage === true &&
    report2Res.body.classification === 'VALID_ROAD_DAMAGE' &&
    ['pothole', 'crack', 'surface_deterioration', 'waterlogging', 'broken_road_edge', 'damaged_drainage', 'debris_on_road'].includes(dbReport2.damageType) &&
    dbReport2.riskScore > 0 &&
    dbReport2.status === 'ASSIGNED' &&
    dbReport2.departmentId !== null &&
    dbReport2.roadSegmentId !== null &&
    dbReport2.slaTargetHours > 0 &&
    inAuthQueue2 === true;

  console.log(`\n>>> CASE 2 RESULT: ${case2Success ? 'PASSED (WORKFLOW EXECUTED)' : 'FAILED'} <<<\n`);

  // Clean up temporary test file
  if (fs.existsSync(normalRoadTmp)) {
    fs.unlinkSync(normalRoadTmp);
  }

  await prisma.$disconnect();
  console.log('================================================================');
  console.log('FINAL SUMMARY:');
  console.log(`  Case 1 (Normal Road with Claim "Pothole"): ${case1Success ? 'PASSED' : 'FAILED'}`);
  console.log(`  Case 2 (Genuine Road Damage Photograph):   ${case2Success ? 'PASSED' : 'FAILED'}`);
  console.log('================================================================');
}

runValidation().catch((err) => {
  console.error('Validation script failed with error:', err);
  process.exit(1);
});
