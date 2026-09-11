import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIVerificationOutput } from './schemas';

interface RoadFixtureSpec {
  name: string;
  size: number;
  sha256Prefix: string;
  damageType: AIAnalysisOutput['damageType'];
}

const KNOWN_ROAD_FIXTURES: RoadFixtureSpec[] = [
  { name: 'large-road-pothole.jpg', size: 436636, sha256Prefix: '58f69eaaf92b', damageType: 'pothole' },
  { name: 'potholes-on-road.jpg', size: 419534, sha256Prefix: '8472e54a6be2', damageType: 'pothole' },
  { name: 'potholes-bengaluru-road.jpg', size: 720454, sha256Prefix: '748a0856b87e', damageType: 'pothole' },
  { name: 'driving-through-potholes.jpg', size: 456933, sha256Prefix: '3d341f4da8d8', damageType: 'pothole' },
  { name: 'pothole-reference.jpg', size: 129857, sha256Prefix: 'cb063df0b5b7', damageType: 'pothole' },
  { name: 'severe-damage-reference.jpg', size: 25368, sha256Prefix: '1ee7ca2544d8', damageType: 'pothole' },
  { name: 'pothole-evidence.svg', size: 4805, sha256Prefix: 'dd9e3d386814', damageType: 'pothole' },
  { name: 'waterlogging-reference.jpg', size: 478881, sha256Prefix: '6a26492c0aba', damageType: 'waterlogging' },
  { name: 'waterlogged-pothole.jpg', size: 385804, sha256Prefix: '2ce2559b0709', damageType: 'waterlogging' },
  { name: 'waterlogging-evidence.svg', size: 3701, sha256Prefix: '0c90caf5e06f', damageType: 'waterlogging' },
  { name: 'surface-deterioration-reference.jpg', size: 234346, sha256Prefix: '8cebab1aa203', damageType: 'surface_deterioration' },
  { name: 'crack-evidence.svg', size: 3233, sha256Prefix: 'f54fe6fff2dc', damageType: 'crack' },
  { name: 'road-edge-reference.jpg', size: 165358, sha256Prefix: '00d305986298', damageType: 'road_edge_damage' },
  { name: 'edge-damage-evidence.svg', size: 2889, sha256Prefix: 'ed9bfba5f80e', damageType: 'road_edge_damage' },
  { name: 'repaired-road-patch.jpg', size: 385642, sha256Prefix: '8dcc673a4518', damageType: 'pothole' },
  { name: 'repaired-road-evidence.svg', size: 3518, sha256Prefix: 'd2796df2b1d8', damageType: 'pothole' },
];

export class DemoAIProvider implements AIProvider {
  name = 'DemoAIProvider (Offline/Hackathon Mode)';

  async analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput> {
    // 1. Clean image tokens from URL and Filename
    const rawUrl = (input.imageUrl || '').toLowerCase();
    const rawFilename = (input.imageFilename || '').toLowerCase();

    const cleanUrl = rawUrl
      .replace(/\/uploads\//gi, ' ')
      .replace(/evidence-\d+-[a-f0-9]+/gi, ' ')
      .replace(/roadguard/gi, ' ');
    const cleanFilename = rawFilename
      .replace(/evidence-\d+-[a-f0-9]+/gi, ' ')
      .replace(/roadguard/gi, ' ');

    // 2. Inspect uploaded file on disk if available
    const candidates = [
      input.imageUrl ? path.basename(input.imageUrl.split('?')[0]) : '',
      input.imageFilename ? path.basename(input.imageFilename.split('?')[0]) : '',
    ].filter(Boolean);

    let embeddedText = '';
    let fileBuffer: Buffer | null = null;
    let matchedRoadFixture: RoadFixtureSpec | null = null;

    const searchDirs = [
      path.resolve(__dirname, '../../../uploads'),
      path.resolve(__dirname, '../../uploads'),
      path.resolve(__dirname, '../../../uploads/demo'),
      path.resolve(__dirname, '../../uploads/demo'),
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(process.cwd(), 'uploads/demo'),
      path.resolve(__dirname, '../../../../frontend/public/demo-evidence'),
      path.resolve(process.cwd(), '../frontend/public/demo-evidence'),
      path.resolve(process.cwd(), 'frontend/public/demo-evidence'),
    ];

    for (const name of candidates) {
      for (const dir of searchDirs) {
        const p = path.join(dir, name);
        if (fs.existsSync(p)) {
          try {
            fileBuffer = fs.readFileSync(p);
            break;
          } catch {
            // Ignore file read error
          }
        }
      }
      if (fileBuffer) break;
    }

    let isValidImageBinary = false;
    if (fileBuffer && fileBuffer.length >= 16) {
      const fileSize = fileBuffer.length;
      const sha256Prefix = crypto.createHash('sha256').update(fileBuffer).digest('hex').slice(0, 12);

      // Check if file matches known road defect fixtures
      for (const fix of KNOWN_ROAD_FIXTURES) {
        if (fileSize === fix.size && sha256Prefix === fix.sha256Prefix) {
          matchedRoadFixture = fix;
          break;
        }
      }

      // Check binary image signatures (JPEG, PNG, WebP, SVG)
      const isJpeg = fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8;
      const isPng = fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4e && fileBuffer[3] === 0x47;
      const isWebp = fileBuffer.length >= 12 && fileBuffer.slice(8, 12).toString() === 'WEBP';
      const isSvgFile = fileBuffer.slice(0, 128).toString().includes('<svg');
      isValidImageBinary = isJpeg || isPng || isWebp || isSvgFile;

      // Extract printable ascii text from first 8192 bytes
      const slice = fileBuffer.slice(0, 8192);
      embeddedText = slice.toString('latin1').replace(/[^a-zA-Z0-9_\-\s]/g, ' ').toLowerCase();
    }

    const normalizedTokens = `${cleanFilename} ${cleanUrl} ${embeddedText}`
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const tokenSet = new Set(normalizedTokens);
    const normalizedText = ` ${normalizedTokens.join(' ')} `;

    // 3. Strict Non-Road / Unrelated Subject Detection
    const nonRoadKeywords = [
      // Identity & Official documents
      'id_card', 'idcard', 'id-card', 'student_id', 'student', 'college', 'school', 'classroom',
      'aadhaar', 'adhaar', 'pan_card', 'pancard', 'license', 'licence', 'certificate', 'marksheet',
      'admit_card', 'roll_no', 'campus', 'hall_ticket', 'receipt', 'invoice', 'textbook', 'notebook', 'resume', 'passport',
      'examination', 'degree', 'diploma', 'candidate', 'university', 'curriculum', 'document', 'doc', 'pdf', 'card',
      // Games & Boards
      'chess', 'chessboard', 'chess_board', 'checkers', 'ludo', 'carrom', 'game', 'board',
      // Posters / Codes / Displays
      'poster', 'movie_poster', 'billboard', 'hoarding', 'flyer', 'banner', 'advertisement',
      'qr', 'qrcode', 'qr_code', 'barcode', 'screenshot', 'screen', 'display',
      // Products / Packaging / Clothing
      'product', 'package', 'packaging', 'box', 'merchandise', 'clothing', 'shirt', 'dress',
      // People / Anatomy / Selfies
      'portrait', 'person', 'selfie', 'face', 'human', 'boy', 'girl', 'man', 'woman',
      'crowd', 'friend', 'chest_photo', 'chest', 'torso', 'child', 'children', 'baby', 'kid',
      // Animals & Food
      'cat', 'dog', 'pet', 'animal', 'bird', 'food', 'dish', 'meal',
      // Furniture & Indoor
      'sofa', 'furniture', 'laptop', 'indoor', 'interior',
      // Graphics / Drawings
      'cartoon', 'anime', 'avatar',
      // Religious & Non-road Photos
      'religious', 'god', 'deity', 'temple', 'mandir', 'pooja', 'idol', 'church', 'mosque', 'prayer',
      'krishna', 'radha', 'shiva', 'jesus', 'buddha', 'ganesha',
      // Nature / Non-road
      'tree', 'park', 'garden', 'forest', 'flower', 'plant',
      // Explicit invalid markers
      'invalid', 'non-road', 'nonroad', 'non_road', 'random', 'unrelated', 'fake', 'sample_id', 'dummy'
    ];

    const hasExplicitNonRoadKeyword = nonRoadKeywords.some((kw) => {
      const cleanKw = kw.replace(/[^a-z0-9]/g, ' ').trim();
      if (cleanKw.includes(' ')) {
        return normalizedText.includes(` ${cleanKw} `);
      }
      return tokenSet.has(cleanKw);
    });

    // 4. IMAGE-FIRST GATE: If image is unrelated or non-road, REJECT IMMEDIATELY.
    // Citizen text description ("pothole", "huge crater") must NEVER override an unrelated image!
    if (hasExplicitNonRoadKeyword) {
      return {
        validRoadDamage: false,
        classification: 'INVALID_EVIDENCE',
        damageType: 'other',
        severity: 'low',
        confidence: 0,
        visibleDamage: false,
        roadSafetyRisk: 0,
        description: 'Invalid road-damage evidence: the uploaded image does not appear to show a road/pavement defect.',
        recommendedAction: 'No civil action required. Report cancelled at intake due to invalid evidence.',
        cancellationReason: 'The uploaded photograph does not appear to show a road/pavement defect.',
        imageQuality: {
          isAcceptable: false,
          isBlurry: false,
          isTooDark: false,
          hasRoadVisible: false,
          qualityScore: 0,
          warningMessage: 'Non-road content detected. Pavement surface absent from evidence.',
        },
      };
    }

    // 5. Supported Road Damage Category Detection in Image Context
    const potholeKeywords = ['pothole', 'potholes', 'crater', 'cavity', 'depression', 'pavement_break', 'road_hole', 'rut', 'pit', 'severepothole', 'deep_pothole'];
    const waterlogKeywords = ['waterlog', 'waterlogging', 'water-filled', 'water_logged', 'waterlogged', 'flood', 'flooded', 'puddle', 'ponding', 'standing_water', 'stormwater', 'submerged'];
    const crackKeywords = ['crack', 'cracks', 'cracking', 'fracture', 'fissure', 'surface_cracking', 'alligator'];
    const surfaceKeywords = ['surface_deterioration', 'surface-deterioration', 'surface_damage', 'raveling', 'ravelling', 'asphalt_peel', 'stripping', 'macadam'];
    const edgeKeywords = ['road-edge', 'road_edge', 'edge_drop', 'edge_dropping', 'shoulder_damage', 'shoulder_drop', 'scour', 'edge_damage', 'berm', 'curb_break', 'road_shoulder'];
    const drainKeywords = ['drain', 'drainage', 'gutter', 'manhole', 'culvert', 'catchbasin', 'storm_drain', 'sewer', 'chamber'];
    const generalRoadKeywords = [
      'asphalt', 'pavement', 'highway', 'street', 'lane', 'tar', 'bitumen', 'carriageway',
      'repaired-road', 'demo-evidence', 'severe-damage', 'tarmac', 'roadway', 'unsplash',
      'photo-1515162816999', '1515162816999',
      'media_1788893506207', 'media_1788893512288', 'media_1788893517822', 'media_1788893525123', 'media_1788893531517'
    ];

    const hasPotholeImage = potholeKeywords.some((kw) => tokenSet.has(kw) || normalizedText.includes(` ${kw} `));
    const hasWaterlogImage = waterlogKeywords.some((kw) => tokenSet.has(kw) || normalizedText.includes(` ${kw} `));
    const hasCrackImage = crackKeywords.some((kw) => tokenSet.has(kw) || normalizedText.includes(` ${kw} `));
    const hasSurfaceImage = surfaceKeywords.some((kw) => tokenSet.has(kw) || normalizedText.includes(` ${kw} `));
    const hasEdgeImage = edgeKeywords.some((kw) => tokenSet.has(kw) || normalizedText.includes(` ${kw} `));
    const hasDrainImage = drainKeywords.some((kw) => tokenSet.has(kw) || normalizedText.includes(` ${kw} `));
    const hasGeneralRoad =
      generalRoadKeywords.some((kw) => tokenSet.has(kw) || normalizedText.includes(` ${kw} `)) ||
      tokenSet.has('road');

    // Camera / Upload evidence check
    const hasImageExtension = /\.(jpe?g|png|webp|svg|heic)$/i.test(rawFilename) || /\.(jpe?g|png|webp|svg|heic)$/i.test(rawUrl);
    const isCameraOrUpload =
      /^img[_\-0-9]/i.test(rawFilename) ||
      /^pxl[_\-0-9]/i.test(rawFilename) ||
      /^media[_\-0-9]/i.test(rawFilename) ||
      /^dsc[_\-0-9]/i.test(rawFilename) ||
      /^photo/i.test(rawFilename) ||
      rawUrl.includes('/uploads/evidence-') ||
      rawUrl.includes('/uploads/');

    const isRoadDamageImage =
      !!matchedRoadFixture ||
      hasPotholeImage ||
      hasWaterlogImage ||
      hasCrackImage ||
      hasSurfaceImage ||
      hasEdgeImage ||
      hasDrainImage ||
      hasGeneralRoad ||
      (isValidImageBinary && !hasExplicitNonRoadKeyword) ||
      (isCameraOrUpload && hasImageExtension && !hasExplicitNonRoadKeyword);

    // 6. Enforce Road Evidence: If no recognizable road defect is present, reject immediately
    if (!isRoadDamageImage) {
      return {
        validRoadDamage: false,
        classification: 'INVALID_EVIDENCE',
        damageType: 'other',
        severity: 'low',
        confidence: 0,
        visibleDamage: false,
        roadSafetyRisk: 0,
        description: 'Invalid road-damage evidence: the uploaded image does not appear to show a road/pavement defect.',
        recommendedAction: 'No civil action required. Report cancelled at intake due to invalid evidence.',
        cancellationReason: 'The uploaded photograph does not appear to show a road/pavement defect.',
        imageQuality: {
          isAcceptable: false,
          isBlurry: false,
          isTooDark: false,
          hasRoadVisible: false,
          qualityScore: 0,
          warningMessage: 'Non-road content detected. Pavement surface absent from evidence.',
        },
      };
    }

    // 7. Resolve Damage Type for Verified Road Damage Image
    let damageType: AIAnalysisOutput['damageType'] = 'pothole';
    if (matchedRoadFixture) {
      damageType = matchedRoadFixture.damageType;
    } else if (hasWaterlogImage) {
      damageType = 'waterlogging';
    } else if (hasCrackImage) {
      damageType = 'crack';
    } else if (hasSurfaceImage) {
      damageType = 'surface_deterioration';
    } else if (hasEdgeImage) {
      damageType = 'road_edge_damage';
    } else if (hasDrainImage) {
      damageType = 'drainage_damage';
    } else if (hasPotholeImage) {
      damageType = 'pothole';
    } else {
      // General road / camera upload image: resolve using damageTypeHint if provided by citizen intake form
      const hint = (input.damageTypeHint || '').toLowerCase();
      if (['pothole', 'waterlogging', 'crack', 'surface_deterioration', 'road_edge_damage', 'drainage_damage'].includes(hint)) {
        damageType = hint as AIAnalysisOutput['damageType'];
      } else {
        damageType = 'pothole';
      }
    }

    // 8. Deterministic severity and roadSafetyRisk based on stable image fingerprint
    let hashVal = 0;
    const hashSeed = `${input.imageUrl || ''}-${input.imageFilename || ''}-${damageType}`;
    for (let i = 0; i < hashSeed.length; i++) {
      hashVal = ((hashVal << 5) - hashVal) + hashSeed.charCodeAt(i);
      hashVal |= 0;
    }
    hashVal = Math.abs(hashVal);

    let severity: AIAnalysisOutput['severity'] = 'medium';
    let roadSafetyRisk = 55;
    let confidence = 0.88;

    if (damageType === 'pothole') {
      if (normalizedText.includes('deep') || normalizedText.includes('crater') || normalizedText.includes('severe') || normalizedText.includes('critical')) {
        severity = 'critical';
        roadSafetyRisk = 88;
        confidence = 0.94;
      } else if (normalizedText.includes('cluster') || normalizedText.includes('multiple') || normalizedText.includes('potholes')) {
        severity = 'high';
        roadSafetyRisk = 78;
        confidence = 0.91;
      } else if (normalizedText.includes('minor') || normalizedText.includes('small') || normalizedText.includes('shallow')) {
        severity = 'medium';
        roadSafetyRisk = 55;
        confidence = 0.86;
      } else {
        // Deterministic selection from stable hash (same image -> identical score every time)
        const variants = [
          { severity: 'critical' as const, roadSafetyRisk: 86, confidence: 0.93 },
          { severity: 'high' as const, roadSafetyRisk: 74, confidence: 0.90 },
          { severity: 'high' as const, roadSafetyRisk: 70, confidence: 0.89 },
          { severity: 'medium' as const, roadSafetyRisk: 62, confidence: 0.88 },
        ];
        const selected = variants[hashVal % variants.length];
        severity = selected.severity;
        roadSafetyRisk = selected.roadSafetyRisk;
        confidence = selected.confidence;
      }
    } else if (damageType === 'waterlogging') {
      severity = 'high';
      roadSafetyRisk = 80;
      confidence = 0.92;
    } else if (damageType === 'crack') {
      severity = 'medium';
      roadSafetyRisk = 55;
      confidence = 0.88;
    } else if (damageType === 'surface_deterioration') {
      severity = 'medium';
      roadSafetyRisk = 50;
      confidence = 0.85;
    } else if (damageType === 'road_edge_damage') {
      severity = 'high';
      roadSafetyRisk = 75;
      confidence = 0.89;
    } else if (damageType === 'drainage_damage') {
      severity = 'high';
      roadSafetyRisk = 70;
      confidence = 0.88;
    }

    // Technical descriptions matching civic engineering terminology
    const descriptionMap: Record<AIAnalysisOutput['damageType'], string> = {
      pothole: 'Depression in the bituminous wearing course with sharp edges, exposing underlying wet granular base course.',
      crack: 'Alligator and longitudinal cracking along the wheel-path corridor, indicating structural subgrade fatigue.',
      surface_deterioration: 'Extensive stripping of asphalt binder and aggregate raveling across carriageway section.',
      waterlogging: 'Substantial surface ponding obstructing traffic lanes and masking submerged pothole hazards for light vehicles.',
      road_edge_damage: 'Significant shoulder drop-off and scour erosion endangering two-wheelers and lane deviations.',
      drainage_damage: 'Side drain blockage or collapsed slab causing storm runoff overflow onto pavement structure.',
      signage_damage: 'Compromised or absent regulatory/warning sign reducing driver visibility at critical road approach.',
      other: 'Visible surface irregularity requiring pavement rehabilitation and safety cordon.',
    };

    const actionMap: Record<AIAnalysisOutput['damageType'], string> = {
      pothole: 'Cold mix or hot bituminous asphalt patch repair with mechanical tack-coat compaction within 48 hours.',
      crack: 'Crack sealing with polymer-modified bitumen emulsion to prevent moisture intrusion into lower layers.',
      surface_deterioration: 'Milling of damaged bituminous layer and installation of 25mm dense bituminous macadam overlay.',
      waterlogging: 'Clearing downstream outfalls and establishing cross-drainage conduits to drain standing water.',
      road_edge_damage: 'Granular shoulder restoration and edge beam reconstruction to eliminate drop-off hazards.',
      drainage_damage: 'Desilting culvert and casting precast RCC drainage covers over exposed channel.',
      signage_damage: 'Immediate installation of reflective retro-grade warning sign as per IRC:67 standards.',
      other: 'Engineering field inspection by Junior Engineer to formulate remedial work order.',
    };

    return {
      validRoadDamage: true,
      classification: 'VALID_ROAD_DAMAGE',
      damageType,
      severity,
      confidence,
      visibleDamage: true,
      roadSafetyRisk,
      description: descriptionMap[damageType],
      recommendedAction: actionMap[damageType],
      imageQuality: {
        isAcceptable: true,
        isBlurry: false,
        isTooDark: false,
        hasRoadVisible: true,
        qualityScore: 92,
      },
    };
  }

  async verifyRepair(input: VerificationInput): Promise<AIVerificationOutput> {
    const after = (input.afterImageUrl || '').toLowerCase();
    const before = (input.beforeImageUrl || '').toLowerCase();

    // 1. Check if after image contains non-road / unrelated subjects
    const nonRoadKeywords = [
      'id_card', 'idcard', 'id-card', 'student', 'college', 'school', 'classroom',
      'aadhaar', 'adhaar', 'pan_card', 'pancard', 'license', 'certificate', 'marksheet',
      'chess', 'game', 'board', 'pawn', 'king', 'queen', 'knight', 'bishop', 'checkers',
      'poster', 'banner', 'flyer', 'billboard', 'hoarding', 'ad', 'advertisement',
      'qr', 'qrcode', 'qr_code', 'qr-code', 'barcode', 'code',
      'screenshot', 'screen', 'display', 'monitor', 'tv',
      'product', 'item', 'package', 'packaging', 'bottle', 'can', 'box',
      'portrait', 'person', 'selfie', 'face', 'human', 'boy', 'girl', 'man', 'woman',
      'crowd', 'people', 'friend', 'chest', 'torso', 'body', 'hand', 'leg', 'setup',
      'child', 'children',
      'cat', 'dog', 'pet', 'animal', 'bird', 'food', 'dish', 'meal',
      'indoor', 'interior', 'room', 'furniture', 'office', 'laptop', 'phone', 'desk',
      'cartoon', 'anime', 'avatar', 'drawing', 'painting', 'sketch',
      'religious', 'god', 'deity', 'temple', 'mandir', 'pooja', 'idol',
      'invalid', 'non-road', 'nonroad', 'random', 'unrelated', 'fake'
    ];
    const afterTokens = after.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    const hasNonRoadAfter = nonRoadKeywords.some((kw) => {
      if (kw.length <= 4 || ['person', 'human', 'face', 'setup', 'chest', 'torso', 'body', 'poster', 'product', 'interior', 'game', 'chess', 'board'].includes(kw)) {
        return afterTokens.includes(kw) || new RegExp(`\\b${kw}\\b`, 'i').test(after);
      }
      return after.includes(kw) || afterTokens.includes(kw);
    });

    const isIdenticalUnchanged = after && before && after === before;

    // Check if after image contains road evidence context
    const roadMarkers = ['road', 'asphalt', 'pavement', 'repair', 'repaired', 'patch', 'tarmac', 'highway', 'street', 'surface', 'pothole', 'bitumen', 'macadam', 'concrete', 'overlay', 'compaction', 'evidence', 'photo-1515162816999', 'unsplash'];
    const hasRoadMarker = roadMarkers.some((kw) => after.includes(kw) || afterTokens.includes(kw));

    // If after image is invalid / non-road
    if (hasNonRoadAfter || !hasRoadMarker) {
      return {
        locationMatchConfidence: 0,
        visibleImprovementScore: 0,
        remainingDamageScore: 100,
        overallConfidence: 0,
        recommendation: 'REJECT',
        explanation: 'Invalid after-repair evidence: the uploaded image does not provide a valid comparable road/repair view.',
      };
    }

    // If identical image uploaded without repair
    if (isIdenticalUnchanged) {
      return {
        locationMatchConfidence: 90,
        visibleImprovementScore: 0,
        remainingDamageScore: 100,
        overallConfidence: 92,
        recommendation: 'REJECT',
        explanation: 'UNREPAIRED ROADWAY: After-repair photograph is identical to original citizen report. No remediation or repair work detected.',
      };
    }

    return {
      locationMatchConfidence: 94,
      visibleImprovementScore: 89,
      remainingDamageScore: 12,
      overallConfidence: 91,
      recommendation: 'PASS',
      explanation:
        'Comparative visual assessment indicates successful patch filling and leveling with asphalt overlay. Road surface geometry matches surrounding pavement without exposed aggregate defects. Final sign-off pending authorized engineer approval.',
    };
  }
}
