import request from 'supertest';
import app from '../src/app';

async function runAcceptanceMatrix() {
  console.log('\n======================================================');
  console.log('       ROADGUARD AI - 5-POINT ACCEPTANCE MATRIX       ');
  console.log('======================================================\n');

  // Authenticate
  const citizenAuth = await request(app)
    .post('/api/auth/login')
    .send({ email: 'citizen@roadguard.demo', password: 'citizen123' });
  const citizenToken = citizenAuth.body.data?.token;

  const authorityAuth = await request(app)
    .post('/api/auth/login')
    .send({ email: 'authority@roadguard.demo', password: 'authority123' });
  const authorityToken = authorityAuth.body.data?.token;

  const adminAuth = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@roadguard.demo', password: 'admin123' });
  const adminToken = adminAuth.body.data?.token;

  const ts = Date.now();

  // ----------------------------------------------------
  // TEST A — GENUINE POTHOLE IMAGE (Real road photo fixture)
  // ----------------------------------------------------
  console.log('--- TEST A: GENUINE POTHOLE IMAGE ---');
  const testARes = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      latitude: 28.9810 + ((ts % 500) / 100000),
      longitude: 77.7410 + ((ts % 500) / 100000),
      address: 'Jail Chungi Road, Meerut',
      description: 'Deep road cavity on traffic corridor endangering vehicles',
      damageTypeHint: 'pothole',
      imageUrl: '/demo-evidence/pothole-reference.jpg',
      imageFilename: 'pothole-reference.jpg',
    });

  const idA = testARes.body.data?.id;
  const authA = await request(app).get(`/api/reports?search=${idA}`).set('Authorization', `Bearer ${authorityToken}`);
  const inAuthA = authA.body.data?.some((r: any) => r.id === idA);
  const adminA = await request(app).get(`/api/reports/${idA}`).set('Authorization', `Bearer ${adminToken}`);
  const inAdminA = adminA.status === 200 && adminA.body.data?.id === idA;

  const passA =
    testARes.body.validRoadDamage === true &&
    testARes.body.data?.status === 'ASSIGNED' &&
    testARes.body.data?.damageType === 'pothole' &&
    testARes.body.data?.riskScore > 0 &&
    inAuthA &&
    inAdminA;

  console.log(`TEST A (pothole): ${passA ? 'PASS' : 'FAIL'} (status=${testARes.body.data?.status}, damageType=${testARes.body.data?.damageType}, riskScore=${testARes.body.data?.riskScore}, inAuth=${inAuthA}, inAdmin=${inAdminA})`);

  // ----------------------------------------------------
  // TEST B — GENUINE WATERLOGGING IMAGE
  // ----------------------------------------------------
  console.log('\n--- TEST B: GENUINE WATERLOGGING IMAGE ---');
  const testBRes = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      latitude: 28.9820 + ((ts % 500) / 100000),
      longitude: 77.7420 + ((ts % 500) / 100000),
      address: 'Surajkund Road, Meerut',
      description: 'Severe waterlogging and surface flooding submerging road',
      damageTypeHint: 'waterlogging',
      imageUrl: '/demo-evidence/waterlogging-reference.jpg',
      imageFilename: 'waterlogging-reference.jpg',
    });

  const idB = testBRes.body.data?.id;
  const authB = await request(app).get(`/api/reports?search=${idB}`).set('Authorization', `Bearer ${authorityToken}`);
  const inAuthB = authB.body.data?.some((r: any) => r.id === idB);
  const adminB = await request(app).get(`/api/reports/${idB}`).set('Authorization', `Bearer ${adminToken}`);
  const inAdminB = adminB.status === 200 && adminB.body.data?.id === idB;

  const passB =
    testBRes.body.validRoadDamage === true &&
    testBRes.body.data?.status === 'ASSIGNED' &&
    testBRes.body.data?.damageType === 'waterlogging' &&
    testBRes.body.data?.riskScore > 0 &&
    inAuthB &&
    inAdminB;

  console.log(`TEST B (waterlogging): ${passB ? 'PASS' : 'FAIL'} (status=${testBRes.body.data?.status}, damageType=${testBRes.body.data?.damageType}, riskScore=${testBRes.body.data?.riskScore}, inAuth=${inAuthB}, inAdmin=${inAdminB})`);

  // ----------------------------------------------------
  // TEST C — NORMAL PERSON / CHILD IMAGE
  // ----------------------------------------------------
  console.log('\n--- TEST C: NORMAL PERSON / CHILD IMAGE ---');
  const testCRes = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      latitude: 28.9830,
      longitude: 77.7430,
      address: 'Civil Lines, Meerut',
      description: 'Huge dangerous pothole on road', // Citizen claims pothole
      imageUrl: '/uploads/child_photo_portrait.jpg',
      imageFilename: 'child_photo_portrait.jpg',
    });

  const idC = testCRes.body.data?.id;
  const authC = await request(app).get('/api/reports').set('Authorization', `Bearer ${authorityToken}`);
  const inAuthC = authC.body.data?.some((r: any) => r.id === idC);
  const adminC = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
  const inAdminCritC = adminC.body.data?.criticalReports?.some((r: any) => r.id === idC);
  const inAdminOverC = adminC.body.data?.overdueReports?.some((r: any) => r.id === idC);
  const myC = await request(app).get('/api/reports/my').set('Authorization', `Bearer ${citizenToken}`);
  const inMyC = myC.body.data?.some((r: any) => r.id === idC);

  const passC =
    testCRes.body.validRoadDamage === false &&
    testCRes.body.data?.status === 'CANCELLED' &&
    testCRes.body.data?.riskScore === 0 &&
    !inAuthC &&
    !inAdminCritC &&
    !inAdminOverC &&
    inMyC;

  console.log(`TEST C (person/child): ${passC ? 'PASS' : 'FAIL'} (status=${testCRes.body.data?.status}, riskScore=${testCRes.body.data?.riskScore}, inAuth=${inAuthC}, inAdmin=${inAdminCritC || inAdminOverC}, inCitizenHistory=${inMyC})`);

  // ----------------------------------------------------
  // TEST D — CARTOON / UNRELATED IMAGE
  // ----------------------------------------------------
  console.log('\n--- TEST D: CARTOON / UNRELATED IMAGE ---');
  const testDRes = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      latitude: 28.9840,
      longitude: 77.7440,
      address: 'Civil Lines, Meerut',
      description: 'Deep road crack on pavement', // Citizen claims defect
      imageUrl: '/uploads/cartoon_avatar_sketch.png',
      imageFilename: 'cartoon_avatar_sketch.png',
    });

  const idD = testDRes.body.data?.id;
  const authD = await request(app).get('/api/reports').set('Authorization', `Bearer ${authorityToken}`);
  const inAuthD = authD.body.data?.some((r: any) => r.id === idD);
  const adminD = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
  const inAdminCritD = adminD.body.data?.criticalReports?.some((r: any) => r.id === idD);
  const inAdminOverD = adminD.body.data?.overdueReports?.some((r: any) => r.id === idD);
  const myD = await request(app).get('/api/reports/my').set('Authorization', `Bearer ${citizenToken}`);
  const inMyD = myD.body.data?.some((r: any) => r.id === idD);

  const passD =
    testDRes.body.validRoadDamage === false &&
    testDRes.body.data?.status === 'CANCELLED' &&
    testDRes.body.data?.riskScore === 0 &&
    !inAuthD &&
    !inAdminCritD &&
    !inAdminOverD &&
    inMyD;

  console.log(`TEST D (cartoon): ${passD ? 'PASS' : 'FAIL'} (status=${testDRes.body.data?.status}, riskScore=${testDRes.body.data?.riskScore}, inAuth=${inAuthD}, inAdmin=${inAdminCritD || inAdminOverD}, inCitizenHistory=${inMyD})`);

  // ----------------------------------------------------
  // TEST E — DOCUMENT / ID CARD IMAGE
  // ----------------------------------------------------
  console.log('\n--- TEST E: DOCUMENT / ID CARD IMAGE ---');
  const testERes = await request(app)
    .post('/api/reports')
    .set('Authorization', `Bearer ${citizenToken}`)
    .send({
      latitude: 28.9850,
      longitude: 77.7450,
      address: 'Civil Lines, Meerut',
      description: 'Road damage and broken tarmac',
      imageUrl: '/uploads/student_id_card_document.png',
      imageFilename: 'student_id_card_document.png',
    });

  const idE = testERes.body.data?.id;
  const authE = await request(app).get('/api/reports').set('Authorization', `Bearer ${authorityToken}`);
  const inAuthE = authE.body.data?.some((r: any) => r.id === idE);
  const adminE = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
  const inAdminCritE = adminE.body.data?.criticalReports?.some((r: any) => r.id === idE);
  const inAdminOverE = adminE.body.data?.overdueReports?.some((r: any) => r.id === idE);
  const myE = await request(app).get('/api/reports/my').set('Authorization', `Bearer ${citizenToken}`);
  const inMyE = myE.body.data?.some((r: any) => r.id === idE);

  const passE =
    testERes.body.validRoadDamage === false &&
    testERes.body.data?.status === 'CANCELLED' &&
    testERes.body.data?.riskScore === 0 &&
    !inAuthE &&
    !inAdminCritE &&
    !inAdminOverE &&
    inMyE;

  console.log(`TEST E (document/ID): ${passE ? 'PASS' : 'FAIL'} (status=${testERes.body.data?.status}, riskScore=${testERes.body.data?.riskScore}, inAuth=${inAuthE}, inAdmin=${inAdminCritE || inAdminOverE}, inCitizenHistory=${inMyE})`);

  console.log('\n======================================================');
  console.log(`ACCEPTANCE MATRIX SUMMARY:`);
  console.log(`- pothole: ${passA ? 'PASS' : 'FAIL'}`);
  console.log(`- waterlogging: ${passB ? 'PASS' : 'FAIL'}`);
  console.log(`- person/random: ${passC ? 'PASS' : 'FAIL'}`);
  console.log(`- cartoon: ${passD ? 'PASS' : 'FAIL'}`);
  console.log(`- document: ${passE ? 'PASS' : 'FAIL'}`);
  console.log(`Authority/Admin isolation: ${!inAuthC && !inAdminCritC && !inAuthD && !inAdminCritD && !inAuthE && !inAdminCritE ? 'PASS' : 'FAIL'}`);
  console.log('======================================================\n');
}

runAcceptanceMatrix();
