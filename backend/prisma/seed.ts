import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ROADGUARD AI Database with Authentic Meerut Locations & Prototype Data...');

  // Clean old records
  await prisma.statusTimelineEvent.deleteMany();
  await prisma.repairVerification.deleteMany();
  await prisma.priorityAssessment.deleteMany();
  await prisma.aIAnalysis.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.roadReport.deleteMany();
  await prisma.tender.deleteMany();
  await prisma.roadSegment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // 1. Create Departments
  const pwdDept = await prisma.department.create({
    data: {
      id: 'dept-pwd-mrt',
      code: 'PWD_MRT',
      name: 'Public Works Department (UP PWD Meerut)',
      jurisdiction: 'Provincial Division Meerut, Uttar Pradesh',
      nodalOfficer: 'Er. R.K. Sharma (Executive Engineer)',
      contactEmail: 'ee-pwd-meerut@up.gov.in.demo',
      slaDaysDefault: 2,
      activeWorkload: 18,
    },
  });

  const nagarNigam = await prisma.department.create({
    data: {
      id: 'dept-nn-mrt',
      code: 'NN_MRT',
      name: 'Meerut Municipal Corporation (Nagar Nigam Meerut)',
      jurisdiction: 'Urban City Corporation Limits, Meerut',
      nodalOfficer: 'Er. A.K. Verma (Chief Engineer, Works)',
      contactEmail: 'works-nagarnigam@meerut.nic.in.demo',
      slaDaysDefault: 3,
      activeWorkload: 14,
    },
  });

  const nhaiDept = await prisma.department.create({
    data: {
      id: 'dept-nhai-mrt',
      code: 'NHAI_MRT',
      name: 'National Highways Authority of India (NHAI Meerut PIU)',
      jurisdiction: 'NHAI Corridors & Bypass Expressways, Meerut',
      nodalOfficer: 'Shri D.P. Gupta (Project Director)',
      contactEmail: 'piu-meerut@nhai.org.demo',
      slaDaysDefault: 1,
      activeWorkload: 5,
    },
  });

  // 2. Create Demo Users
  const citizenPass = await bcrypt.hash('citizen123', 10);
  const authPass = await bcrypt.hash('authority123', 10);
  const adminPass = await bcrypt.hash('admin123', 10);

  const citizenUser = await prisma.user.create({
    data: {
      id: 'user-citizen-01',
      email: 'citizen@roadguard.demo',
      passwordHash: citizenPass,
      name: 'Arun Kumar (Citizen)',
      role: 'CITIZEN',
      phone: '+91 98765 43210',
    },
  });

  const authorityUser = await prisma.user.create({
    data: {
      id: 'user-authority-01',
      email: 'authority@roadguard.demo',
      passwordHash: authPass,
      name: 'Er. Rajesh Bansal (Executive Engineer, PWD)',
      role: 'AUTHORITY',
      departmentId: pwdDept.id,
      phone: '+91 94120 12345',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      id: 'user-admin-01',
      email: 'admin@roadguard.demo',
      passwordHash: adminPass,
      name: 'System Administrator (RoadGuard Admin)',
      role: 'ADMIN',
      phone: '+91 94100 00000',
    },
  });

  // 3. Create Recognizable Meerut Road Segments
  const segment1 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-01',
      code: 'MRT-RD-01',
      name: 'Jail Chungi Road, Meerut',
      startLat: 28.9815,
      startLng: 77.7380,
      endLat: 28.9865,
      endLng: 77.7485,
      lengthKm: 3.8,
      departmentId: pwdDept.id,
      importanceLevel: 'ARTERIAL',
      healthScore: 52, // Chronically deteriorating
      openComplaints: 7,
      criticalComplaints: 3,
      resolvedComplaints: 14,
      recurringDamageCount: 6,
      isRecurringHotspot: true,
      reportingCoverage: 'HIGH',
      lastInspectionDate: new Date(Date.now() - 15 * 86400000),
      lastRepairDate: new Date(Date.now() - 45 * 86400000),
    },
  });

  const segment2 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-02',
      code: 'MRT-RD-02',
      name: 'Surajkund Road, Meerut',
      startLat: 28.9850,
      startLng: 77.7210,
      endLat: 28.9925,
      endLng: 77.7320,
      lengthKm: 3.2,
      departmentId: nagarNigam.id,
      importanceLevel: 'MAJOR_DISTRICT',
      healthScore: 61,
      openComplaints: 5,
      criticalComplaints: 2,
      resolvedComplaints: 18,
      recurringDamageCount: 4,
      isRecurringHotspot: true,
      reportingCoverage: 'HIGH',
      lastInspectionDate: new Date(Date.now() - 8 * 86400000),
      lastRepairDate: new Date(Date.now() - 60 * 86400000),
    },
  });

  const segment3 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-03',
      code: 'MRT-RD-03',
      name: 'Baghpat Bypass Road, Meerut',
      startLat: 28.9680,
      startLng: 77.6480,
      endLat: 28.9855,
      endLng: 77.6650,
      lengthKm: 7.5,
      departmentId: pwdDept.id,
      importanceLevel: 'ARTERIAL',
      healthScore: 46, // Critical deterioration
      openComplaints: 9,
      criticalComplaints: 4,
      resolvedComplaints: 8,
      recurringDamageCount: 7,
      isRecurringHotspot: true,
      reportingCoverage: 'HIGH',
      lastInspectionDate: new Date(Date.now() - 25 * 86400000),
      lastRepairDate: new Date(Date.now() - 90 * 86400000),
    },
  });

  const segment4 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-04',
      code: 'MRT-RD-04',
      name: 'Garh Road, Meerut',
      startLat: 28.9670,
      startLng: 77.7320,
      endLat: 28.9790,
      endLng: 77.7580,
      lengthKm: 5.6,
      departmentId: pwdDept.id,
      importanceLevel: 'ARTERIAL',
      healthScore: 78,
      openComplaints: 3,
      criticalComplaints: 0,
      resolvedComplaints: 16,
      recurringDamageCount: 1,
      isRecurringHotspot: false,
      reportingCoverage: 'HIGH',
      lastInspectionDate: new Date(Date.now() - 5 * 86400000),
      lastRepairDate: new Date(Date.now() - 20 * 86400000),
    },
  });

  const segment5 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-05',
      code: 'MRT-RD-05',
      name: 'Hapur Road, Meerut',
      startLat: 28.9510,
      startLng: 77.7080,
      endLat: 28.9710,
      endLng: 77.7160,
      lengthKm: 4.9,
      departmentId: nagarNigam.id,
      importanceLevel: 'ARTERIAL',
      healthScore: 69,
      openComplaints: 4,
      criticalComplaints: 1,
      resolvedComplaints: 21,
      recurringDamageCount: 2,
      isRecurringHotspot: false,
      reportingCoverage: 'HIGH',
      lastInspectionDate: new Date(Date.now() - 10 * 86400000),
      lastRepairDate: new Date(Date.now() - 40 * 86400000),
    },
  });

  const segment6 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-06',
      code: 'MRT-RD-06',
      name: 'Kankerkheda Main Road, Meerut',
      startLat: 29.0120,
      startLng: 77.6680,
      endLat: 29.0290,
      endLng: 77.6840,
      lengthKm: 4.2,
      departmentId: pwdDept.id,
      importanceLevel: 'MAJOR_DISTRICT',
      healthScore: 58,
      openComplaints: 6,
      criticalComplaints: 2,
      resolvedComplaints: 11,
      recurringDamageCount: 5,
      isRecurringHotspot: true,
      reportingCoverage: 'MODERATE',
      lastInspectionDate: new Date(Date.now() - 14 * 86400000),
      lastRepairDate: new Date(Date.now() - 50 * 86400000),
    },
  });

  const segment7 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-07',
      code: 'MRT-RD-07',
      name: 'Civil Lines, Meerut',
      startLat: 28.9940,
      startLng: 77.7120,
      endLat: 29.0060,
      endLng: 77.7225,
      lengthKm: 3.1,
      departmentId: nagarNigam.id,
      importanceLevel: 'LOCAL',
      healthScore: 84, // Good condition
      openComplaints: 1,
      criticalComplaints: 0,
      resolvedComplaints: 15,
      recurringDamageCount: 0,
      isRecurringHotspot: false,
      reportingCoverage: 'HIGH',
      lastInspectionDate: new Date(Date.now() - 4 * 86400000),
      lastRepairDate: new Date(Date.now() - 15 * 86400000),
    },
  });

  const segment8 = await prisma.roadSegment.create({
    data: {
      id: 'seg-mrt-08',
      code: 'MRT-RD-08',
      name: 'Malyana Chowki – Sharda Road Link, Meerut',
      startLat: 28.9640,
      startLng: 77.6740,
      endLat: 28.9720,
      endLng: 77.6980,
      lengthKm: 3.7,
      departmentId: nagarNigam.id,
      importanceLevel: 'LOCAL',
      healthScore: 41, // Critical deterioration
      openComplaints: 8,
      criticalComplaints: 4,
      resolvedComplaints: 7,
      recurringDamageCount: 8,
      isRecurringHotspot: true,
      reportingCoverage: 'HIGH',
      lastInspectionDate: new Date(Date.now() - 20 * 86400000),
      lastRepairDate: new Date(Date.now() - 85 * 86400000),
    },
  });

  // 4. Create Public Tender Records (Clearly labeled DEMO records for SIH evaluation)
  await prisma.tender.create({
    data: {
      id: 'tnd-mrt-01',
      tenderId: 'UP-PWD-MRT-2024-JLC-041',
      tenderRefNumber: '1102/24A/2024-25',
      roadName: 'Jail Chungi Road, Meerut',
      workDescription: 'Periodic renewal and surface rectification of Jail Chungi Road with 30mm Bituminous Concrete overlay.',
      departmentId: pwdDept.id,
      roadSegmentId: segment1.id,
      tenderValue: '₹2.48 Crore',
      tenderDate: '2024-06-18',
      workPeriod: '9 Months (Defect Liability Period: 36 Months)',
      tenderStatus: 'Awarded',
      invitingAuthority: 'Executive Engineer, Provincial Division, UP PWD Meerut',
      contractor: 'M/s Meerut Highway Infrastructure Pvt. Ltd. (DEMO)',
      contractorStatus: 'VERIFIED',
      officialSourceUrl: 'https://etender.up.nic.in/nicgep/app',
      sourceDate: '2024-07-02',
      verificationStatus: 'SOURCE FOUND (DEMO)',
      notes: 'Demo tender profile calibrated for SIH 2026 Internal Hackathon; exhibits active warranty DLP.',
    },
  });

  await prisma.tender.create({
    data: {
      id: 'tnd-mrt-02',
      tenderId: 'UP-PWD-MRT-2024-BGP-089',
      tenderRefNumber: '1450/42C/2024-25',
      roadName: 'Baghpat Bypass Road, Meerut',
      workDescription: 'Widening to intermediate lane and strengthening along Baghpat Bypass Corridor.',
      departmentId: pwdDept.id,
      roadSegmentId: segment3.id,
      tenderValue: '₹4.15 Crore',
      tenderDate: '2024-08-11',
      workPeriod: '12 Months',
      tenderStatus: 'Under Maintenance',
      invitingAuthority: 'Superintending Engineer, Meerut Circle, UP PWD',
      contractor: 'Contractor information pending in retrieved public summary (DEMO)',
      contractorStatus: 'UNVERIFIED',
      officialSourceUrl: 'https://etender.up.nic.in/nicgep/app',
      sourceDate: '2024-08-25',
      verificationStatus: 'SOURCE FOUND (DEMO)',
      notes: 'Tender NIT verified in prototype index; contractor documentation pending gazette update.',
    },
  });

  await prisma.tender.create({
    data: {
      id: 'tnd-mrt-03',
      tenderId: 'NN-MRT-2023-SJK-012',
      tenderRefNumber: '890/19W/2023-24',
      roadName: 'Surajkund Road, Meerut',
      workDescription: 'New construction, side drain desilting, and blacktopping of Surajkund Road corridor.',
      departmentId: nagarNigam.id,
      roadSegmentId: segment2.id,
      tenderValue: '₹1.88 Crore',
      tenderDate: '2023-11-05',
      workPeriod: '6 Months',
      tenderStatus: 'Completed',
      invitingAuthority: 'Chief Engineer, Nagar Nigam Meerut',
      contractor: 'Shree Krishna Construction Co. (Meerut) (DEMO)',
      contractorStatus: 'VERIFIED',
      officialSourceUrl: 'https://meerutnagarnigam.in/tenders.php',
      sourceDate: '2023-12-10',
      verificationStatus: 'VERIFIED (DEMO)',
      notes: 'Road exhibits premature distress within warranty DLP period; civic audit flag active.',
    },
  });

  await prisma.tender.create({
    data: {
      id: 'tnd-mrt-04',
      tenderId: 'UP-PWD-MRT-2024-GRH-099',
      tenderRefNumber: 'MC/ENG/2024/782',
      roadName: 'Garh Road, Meerut',
      workDescription: 'Special repair and bituminous resurfacing of Garh Road commercial corridor.',
      departmentId: pwdDept.id,
      roadSegmentId: segment4.id,
      tenderValue: '₹3.60 Crore',
      tenderDate: '2024-09-14',
      workPeriod: '4 Months',
      tenderStatus: 'Active',
      invitingAuthority: 'Executive Engineer, UP PWD Meerut',
      contractor: 'Apex Infra Projects Pvt. Ltd. (DEMO)',
      contractorStatus: 'VERIFIED',
      officialSourceUrl: 'https://etender.up.nic.in/nicgep/app',
      sourceDate: '2024-09-20',
      verificationStatus: 'SOURCE FOUND (DEMO)',
      notes: 'Public procurement notice calibrated for prototype testing.',
    },
  });

  await prisma.tender.create({
    data: {
      id: 'tnd-mrt-05',
      tenderId: 'NN-MRT-2025-HPR-015',
      tenderRefNumber: 'MC/CIVIL/2025/104',
      roadName: 'Hapur Road, Meerut',
      workDescription: 'RCC Storm water side drain construction and junction paver restoration near Hapur Adda.',
      departmentId: nagarNigam.id,
      roadSegmentId: segment5.id,
      tenderValue: '₹1.95 Crore',
      tenderDate: '2025-01-10',
      workPeriod: '6 Months',
      tenderStatus: 'Active',
      invitingAuthority: 'Municipal Commissioner, Nagar Nigam Meerut',
      contractor: 'M/s Urban Infra Solutions (DEMO)',
      contractorStatus: 'VERIFIED',
      officialSourceUrl: 'https://meerutnagarnigam.in/tenders.php',
      sourceDate: '2025-01-22',
      verificationStatus: 'VERIFIED (DEMO)',
      notes: 'Tender active with live milestone tracking and civil complaint correlation.',
    },
  });

  // 5. Seed 32 Realistic Road Reports with Consistent Meerut Locations
  console.log('Seeding 32 realistic road complaints across authentic Meerut locations...');

  const demoEvidenceMap: Record<string, { url: string; filename: string }> = {
    pothole: { url: '/demo-evidence/pothole-evidence.svg', filename: 'pothole-evidence.svg' },
    waterlogging: { url: '/demo-evidence/waterlogging-evidence.svg', filename: 'waterlogging-evidence.svg' },
    crack: { url: '/demo-evidence/crack-evidence.svg', filename: 'crack-evidence.svg' },
    surface_deterioration: { url: '/demo-evidence/crack-evidence.svg', filename: 'crack-evidence.svg' },
    road_edge_damage: { url: '/demo-evidence/edge-damage-evidence.svg', filename: 'edge-damage-evidence.svg' },
    drainage_damage: { url: '/demo-evidence/waterlogging-evidence.svg', filename: 'waterlogging-evidence.svg' },
    signage_damage: { url: '/demo-evidence/edge-damage-evidence.svg', filename: 'edge-damage-evidence.svg' },
  };

  const reportTemplates = [
    {
      id: 'RG-MRT-2026-000101',
      seg: segment1,
      lat: 28.9835,
      lng: 77.7425,
      locName: 'Jail Chungi Road, Meerut',
      type: 'pothole',
      sev: 'critical',
      risk: 88,
      status: 'ASSIGNED',
      desc: 'Severe depression and deep pothole exceeding 18cm right on the vehicular trajectory near Jail Chungi crossing.',
      img: demoEvidenceMap.pothole.url,
      filename: demoEvidenceMap.pothole.filename,
      isRec: true,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000102',
      seg: segment1,
      lat: 28.9838,
      lng: 77.7429, // 45m away: duplicate cluster
      locName: 'Jail Chungi Road, Meerut',
      type: 'pothole',
      sev: 'critical',
      risk: 86,
      status: 'ASSIGNED',
      desc: 'Massive crater in front of commercial complex causing two-wheeler skidding near Jail Chungi. High risk of fatal accident.',
      img: demoEvidenceMap.pothole.url,
      filename: demoEvidenceMap.pothole.filename,
      isRec: true,
      isDup: true,
      dupId: 'RG-MRT-2026-000101',
    },
    {
      id: 'RG-MRT-2026-000103',
      seg: segment2,
      lat: 28.9880,
      lng: 77.7260,
      locName: 'Surajkund Road, Meerut',
      type: 'waterlogging',
      sev: 'critical',
      risk: 92,
      status: 'INSPECTION_SCHEDULED',
      desc: 'Complete carriage lane inundated with 30cm standing sewage water concealing broken drain slabs near Surajkund Park.',
      img: demoEvidenceMap.waterlogging.url,
      filename: demoEvidenceMap.waterlogging.filename,
      isRec: true,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000104',
      seg: segment3,
      lat: 28.9740,
      lng: 77.6530,
      locName: 'Baghpat Bypass Road, Meerut',
      type: 'crack',
      sev: 'medium',
      risk: 52,
      status: 'ACKNOWLEDGED',
      desc: 'Continuous longitudinal shear cracks and alligator fatigue along the center lane over 40 meters near Baghpat Bypass flyover.',
      img: demoEvidenceMap.crack.url,
      filename: demoEvidenceMap.crack.filename,
      isRec: false,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000105',
      seg: segment4,
      lat: 28.9720,
      lng: 77.7420,
      locName: 'Garh Road, Meerut',
      type: 'road_edge_damage',
      sev: 'high',
      risk: 76,
      status: 'REPAIR_IN_PROGRESS',
      desc: 'Collapsed berm edge and washed out subbase creating 25cm dangerous dropoff near Garh Road medical corridor.',
      img: demoEvidenceMap.road_edge_damage.url,
      filename: demoEvidenceMap.road_edge_damage.filename,
      isRec: true,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000106',
      seg: segment5,
      lat: 28.9610,
      lng: 77.7120,
      locName: 'Hapur Road, Meerut',
      type: 'pothole',
      sev: 'high',
      risk: 74,
      status: 'RESOLVED',
      desc: 'Sharp-edged pothole on Hapur Road repaired with dense bituminous asphalt overlay under municipal contract.',
      img: demoEvidenceMap.pothole.url,
      filename: demoEvidenceMap.pothole.filename,
      afterImg: '/demo-evidence/repaired-road-evidence.svg',
      isRec: false,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000107',
      seg: segment8,
      lat: 28.9660,
      lng: 77.6760,
      locName: 'Malyana Chowki, Meerut',
      type: 'surface_deterioration',
      sev: 'high',
      risk: 81,
      status: 'NEEDS_REINSPECTION',
      desc: 'Aggregates stripping rapidly after light rain near Malyana Chowki. Bitumen wash-off indicates defective compaction.',
      img: demoEvidenceMap.surface_deterioration.url,
      filename: demoEvidenceMap.surface_deterioration.filename,
      isRec: true,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000108',
      seg: segment6,
      lat: 29.0220,
      lng: 77.6750,
      locName: 'Kankerkheda, Meerut',
      type: 'drainage_damage',
      sev: 'high',
      risk: 78,
      status: 'ASSIGNED',
      desc: 'Broken culvert cover slab with exposed reinforcement rebar directly in vehicular trajectory in Kankerkheda main market.',
      img: demoEvidenceMap.drainage_damage.url,
      filename: demoEvidenceMap.drainage_damage.filename,
      isRec: true,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000109',
      seg: segment7,
      lat: 28.9980,
      lng: 77.7160,
      locName: 'Civil Lines, Meerut',
      type: 'signage_damage',
      sev: 'low',
      risk: 36,
      status: 'ACKNOWLEDGED',
      desc: 'Bent speed-breaker warning signage obscured by roadside trees near Civil Lines administrative court road.',
      img: demoEvidenceMap.signage_damage.url,
      filename: demoEvidenceMap.signage_damage.filename,
      isRec: false,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000110',
      seg: segment8,
      lat: 28.9700,
      lng: 77.6940,
      locName: 'Sharda Road, Meerut',
      type: 'pothole',
      sev: 'medium',
      risk: 58,
      status: 'INSPECTION_SCHEDULED',
      desc: 'Cluster of 3 potholes on carriageway approaching Sharda Road intersection creating slow-moving traffic jams.',
      img: demoEvidenceMap.pothole.url,
      filename: demoEvidenceMap.pothole.filename,
      isRec: false,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000111',
      seg: segment2,
      lat: 28.9865,
      lng: 77.7230,
      locName: 'Gandhi Ashram – Surajkund Route, Meerut',
      type: 'waterlogging',
      sev: 'high',
      risk: 75,
      status: 'ASSIGNED',
      desc: 'Blocked side channels causing knee-deep overflow across carriage way near Gandhi Ashram turn on Surajkund route.',
      img: demoEvidenceMap.waterlogging.url,
      filename: demoEvidenceMap.waterlogging.filename,
      isRec: true,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000112',
      seg: segment7,
      lat: 28.9950,
      lng: 77.7040,
      locName: 'Lalkurti, Meerut',
      type: 'pothole',
      sev: 'medium',
      risk: 62,
      status: 'ACKNOWLEDGED',
      desc: 'Deep asphalt hollow at the central market intersection near Lalkurti bazaar.',
      img: demoEvidenceMap.pothole.url,
      filename: demoEvidenceMap.pothole.filename,
      isRec: false,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000113',
      seg: segment4,
      lat: 28.9790,
      lng: 77.7480,
      locName: 'Mangal Pandey Nagar, Meerut',
      type: 'crack',
      sev: 'medium',
      risk: 55,
      status: 'ASSIGNED',
      desc: 'Fatigue block cracking in asphalt surface adjacent to Mangal Pandey Nagar commercial sector.',
      img: demoEvidenceMap.crack.url,
      filename: demoEvidenceMap.crack.filename,
      isRec: false,
      isDup: false,
    },
    {
      id: 'RG-MRT-2026-000114',
      seg: segment5,
      lat: 28.9685,
      lng: 77.7145,
      locName: 'Hapur Adda, Meerut',
      type: 'pothole',
      sev: 'critical',
      risk: 89,
      status: 'ASSIGNED',
      desc: 'Deep cavity in bus lane approaching Hapur Adda roundabout creating severe risk for heavy passenger vehicles.',
      img: demoEvidenceMap.pothole.url,
      filename: demoEvidenceMap.pothole.filename,
      isRec: true,
      isDup: false,
    },
  ];

  // Specific Meerut area locations dictionary for remaining items
  const meerutLocations = [
    { seg: segment1, name: 'Jail Chungi Road, Meerut', baseLat: 28.9840, baseLng: 77.7440 },
    { seg: segment2, name: 'Surajkund Road, Meerut', baseLat: 28.9890, baseLng: 77.7280 },
    { seg: segment3, name: 'Baghpat Bypass Road, Meerut', baseLat: 28.9770, baseLng: 77.6580 },
    { seg: segment4, name: 'Garh Road, Meerut', baseLat: 28.9740, baseLng: 77.7460 },
    { seg: segment5, name: 'Hapur Road, Meerut', baseLat: 28.9640, baseLng: 77.7130 },
    { seg: segment6, name: 'Kankerkheda, Meerut', baseLat: 29.0200, baseLng: 77.6740 },
    { seg: segment7, name: 'Civil Lines, Meerut', baseLat: 29.0010, baseLng: 77.7180 },
    { seg: segment8, name: 'Malyana Chowki, Meerut', baseLat: 28.9670, baseLng: 77.6820 },
    { seg: segment8, name: 'Sharda Road, Meerut', baseLat: 28.9715, baseLng: 77.6950 },
    { seg: segment7, name: 'Lalkurti, Meerut', baseLat: 28.9960, baseLng: 77.7060 },
    { seg: segment4, name: 'Mangal Pandey Nagar, Meerut', baseLat: 28.9775, baseLng: 77.7490 },
    { seg: segment2, name: 'Gandhi Ashram – Surajkund Route, Meerut', baseLat: 28.9870, baseLng: 77.7240 },
  ];

  // Populate remaining items (15 to 32)
  for (let i = 15; i <= 32; i++) {
    const loc = meerutLocations[(i - 15) % meerutLocations.length];
    const types = ['pothole', 'crack', 'surface_deterioration', 'waterlogging', 'road_edge_damage'];
    const sevs = ['low', 'medium', 'high', 'critical'];
    const statuses = ['ASSIGNED', 'ACKNOWLEDGED', 'INSPECTION_SCHEDULED', 'REPAIR_IN_PROGRESS', 'RESOLVED'];

    const chosenType = types[i % types.length];
    const chosenSev = sevs[i % sevs.length];
    const chosenStatus = statuses[i % statuses.length];
    const risk = chosenSev === 'critical' ? 84 + (i % 10) : chosenSev === 'high' ? 68 + (i % 12) : 40 + (i % 20);

    const asset = demoEvidenceMap[chosenType] || demoEvidenceMap.pothole;

    // Plausible slight offsets within ~100-300m
    const offsetLat = ((i * 3) % 11 - 5) * 0.0008;
    const offsetLng = ((i * 7) % 11 - 5) * 0.0008;

    reportTemplates.push({
      id: `RG-MRT-2026-${String(i + 100).padStart(6, '0')}`,
      seg: loc.seg,
      lat: Number((loc.baseLat + offsetLat).toFixed(5)),
      lng: Number((loc.baseLng + offsetLng).toFixed(5)),
      locName: loc.name,
      type: chosenType,
      sev: chosenSev,
      risk,
      status: chosenStatus,
      desc: `Pavement distress identified: ${chosenType.replace(/_/g, ' ')} requiring civil inspection along ${loc.name}.`,
      img: asset.url,
      filename: asset.filename,
      isRec: loc.seg.isRecurringHotspot,
      isDup: false,
    } as any);
  }

  for (const t of reportTemplates) {
    const isOverdue = t.status !== 'RESOLVED' && (t.sev === 'critical' || t.sev === 'high') && Math.random() > 0.6;
    const hours = t.sev === 'critical' ? 24 : t.sev === 'high' ? 48 : 120;
    const createdAt = new Date(Date.now() - (isOverdue ? 72 : 12) * 3600000);
    const slaDueAt = new Date(createdAt.getTime() + hours * 3600000);

    await prisma.roadReport.create({
      data: {
        id: t.id,
        userId: citizenUser.id,
        imageUrl: t.img,
        evidenceSource: 'DEMO_SYNTHETIC',
        evidenceSourceMetadata: JSON.stringify({
          title: `${t.type.replace(/_/g, ' ').toUpperCase()} Distress Reference Evidence`,
          source: 'MoRTH & Indian Roads Congress IRC:82 Test Dataset',
          sourceUrl: 'https://morth.nic.in',
          date: '2025-08-15',
          attribution: 'Calibrated Pavement Distress Synthetic Demonstration Asset',
          note: 'Explicitly labeled DEMO EVIDENCE for SIH 2026 Internal Hackathon',
        }),
        imageFilename: (t as any).filename || 'pothole-evidence.svg',
        imageMimeType: 'image/svg+xml',
        latitude: t.lat,
        longitude: t.lng,
        address: (t as any).locName || `${t.seg.name}, Meerut`,
        description: t.desc,
        damageType: t.type,
        severity: t.sev,
        status: t.status,
        roadSegmentId: t.seg.id,
        departmentId: t.seg.departmentId,
        riskScore: t.risk,
        isDuplicate: t.isDup || false,
        duplicateOfId: (t as any).dupId || null,
        isRecurring: t.isRec,
        slaTargetHours: hours,
        slaDueAt,
        isOverdue,
        overdueHours: isOverdue ? 24 : 0,
        repairBeforeImageUrl: t.img,
        repairAfterImageUrl: (t as any).afterImg || null,
        aiAnalysis: {
          create: {
            damageType: t.type,
            severity: t.sev,
            confidence: 0.91,
            visibleDamage: true,
            roadSafetyRisk: t.risk,
            description: `Automated optical inspection: ${t.type.replace(/_/g, ' ')} confirmed with visible pavement distress.`,
            recommendedAction: `Departmental remediation according to IRC:82 specifications.`,
            isAcceptableQuality: true,
            qualityScore: 92,
            isBlurry: false,
            isTooDark: false,
            hasRoadVisible: true,
            isDuplicate: t.isDup || false,
            potentialDuplicateOf: (t as any).dupId || null,
          },
        },
        priorityAssessment: {
          create: {
            overallScore: t.risk,
            riskLevel: t.risk >= 80 ? 'CRITICAL' : t.risk >= 65 ? 'HIGH' : t.risk >= 45 ? 'MEDIUM' : 'LOW',
            severityScore: 22,
            safetyRiskScore: 18,
            densityScore: 12,
            roadImportanceScore: 16,
            recurrenceScore: t.isRec ? 10 : 2,
            slaUrgencyScore: isOverdue ? 10 : 4,
            explanation: JSON.stringify([
              `Classified as ${t.sev.toUpperCase()} severity on ${(t as any).locName || t.seg.name}.`,
              t.isRec ? 'Chronic damage recurrence logged within past maintenance cycle.' : 'Isolated pavement distress incident.',
            ]),
          },
        },
        timeline: {
          create: [
            {
              status: 'REPORTED',
              label: 'Citizen Report Submitted',
              description: `Citizen logged geo-tagged image and condition description at ${(t as any).locName || t.seg.name}.`,
              timestamp: createdAt,
            },
            {
              status: 'AI_ANALYZED',
              label: 'AI Pavement Assessment',
              description: `Defect identified as ${t.type.replace(/_/g, ' ')} (${t.sev.toUpperCase()}).`,
              timestamp: new Date(createdAt.getTime() + 120000),
            },
            {
              status: 'ASSIGNED',
              label: 'Automated Dispatch',
              description: `Assigned to ${t.seg.departmentId === pwdDept.id ? 'UP PWD Meerut' : 'Nagar Nigam Meerut'}.`,
              timestamp: new Date(createdAt.getTime() + 300000),
            },
            ...(t.status === 'RESOLVED'
              ? [
                  {
                    status: 'REPAIR_COMPLETED',
                    label: 'Repair Executed by Contractor',
                    description: 'Pavement restored and leveled with asphalt patch.',
                    timestamp: new Date(Date.now() - 10000000),
                  },
                  {
                    status: 'RESOLVED',
                    label: 'Complaint Formally Resolved',
                    description: 'AI verification match 94%. Signed off by Executive Engineer.',
                    timestamp: new Date(Date.now() - 5000000),
                  },
                ]
              : []),
          ],
        },
      },
    });
  }

  // 6. Create Notifications
  await prisma.notification.create({
    data: {
      userId: authorityUser.id,
      title: '🚨 Critical Pothole Alert: Jail Chungi Road',
      message: 'Critical severity report RG-MRT-2026-000101 assigned on Jail Chungi Road, Meerut. 24-hour SLA deadline active.',
      type: 'SLA_BREACH',
      reportId: 'RG-MRT-2026-000101',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: authorityUser.id,
      title: '🌧️ Recurring Waterlogging: Surajkund Road',
      message: 'Persistent drainage overflow logged on Surajkund Road, Meerut (Hotspot index: 61/100).',
      type: 'HOTSPOT_ALERT',
      reportId: 'RG-MRT-2026-000103',
      isRead: false,
    },
  });

  console.log('✅ Database seeded successfully with 8 Meerut Road Segments, 5 Tenders, and 32 Meerut Reports!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
