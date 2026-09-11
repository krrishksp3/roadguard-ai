import fs from 'fs';
import path from 'path';
import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIVerificationOutput } from './schemas';

export class DemoAIProvider implements AIProvider {
  name = 'DemoAIProvider (Offline/Hackathon Mode)';

  async analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput> {
    // 1. IMAGE CONTEXT IS PRIMARY SIGNAL
    // Extract clean image tokens: strip domain names, storage paths (/uploads/), and multer prefixes (evidence-)
    const cleanUrl = (input.imageUrl || '')
      .replace(/https?:\/\/[^\/]+/gi, '')
      .replace(/\/uploads\//gi, '')
      .replace(/evidence-\d+-[a-f0-9]+/gi, '')
      .replace(/roadguard/gi, '')
      .toLowerCase();
    const cleanFilename = (input.imageFilename || '')
      .replace(/evidence-\d+-[a-f0-9]+/gi, '')
      .replace(/roadguard/gi, '')
      .toLowerCase();
    let imageContext = `${cleanFilename} ${cleanUrl}`;
    
    // Inspect uploaded file on disk if available for embedded text/metadata markers
    try {
      const candidates = [
        input.imageUrl ? path.basename(input.imageUrl.split('?')[0]) : '',
        input.imageFilename || ''
      ].filter(Boolean);

      for (const name of candidates) {
        const filePath = path.resolve(__dirname, '../../uploads', name);
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          const sample = buffer.slice(0, 4096).toString('latin1').toLowerCase();
          imageContext += ` ${sample}`;
          break;
        }
      }
    } catch {
      // Non-blocking file inspection fallback
    }

    // User text is secondary context only (never used as primary evidence)
    const userText = (input.description || '').toLowerCase();

    // 2. Explicit Non-Road / Unrelated Subject Tokens
    const nonRoadKeywords = [
      // Identity & Official documents
      'id_card', 'idcard', 'id-card', 'student', 'college', 'school', 'classroom',
      'aadhaar', 'adhaar', 'pan_card', 'pancard', 'license', 'certificate', 'marksheet',
      'admit_card', 'roll_no', 'campus', 'hall_ticket', 'document', 'doc', 'pdf',
      'paper', 'receipt', 'invoice', 'form', 'textbook', 'notebook', 'resume',
      // Games & Boards
      'chess', 'game', 'board', 'pawn', 'king', 'queen', 'knight', 'bishop', 'checkers', 'dice',
      // Posters / Codes / Displays
      'poster', 'banner', 'flyer', 'billboard', 'hoarding', 'ad', 'advertisement',
      'qr', 'qrcode', 'qr_code', 'qr-code', 'barcode', 'code',
      'screenshot', 'screen', 'display', 'monitor', 'tv',
      // Products / Merchandise / Packaging
      'product', 'item', 'package', 'packaging', 'bottle', 'can', 'box', 'merchandise',
      'clothing', 'shirt', 'dress', 'shoe', 'bag',
      // People / Anatomy
      'portrait', 'person', 'selfie', 'face', 'human', 'boy', 'girl', 'man', 'woman',
      'crowd', 'profile', 'people', 'friend', 'group', 'chest', 'torso', 'body', 'hand', 'leg', 'setup',
      'child', 'children',
      // Animals & Food
      'cat', 'dog', 'pet', 'animal', 'bird', 'food', 'dish', 'meal', 'fruit', 'vegetable', 'snack',
      // Buildings & Interiors
      'indoor', 'interior', 'room', 'bed', 'sofa', 'furniture', 'office', 'laptop', 'phone', 'desk',
      'wall', 'ceiling', 'tile', 'door', 'window', 'kitchen', 'hallway', 'living_room', 'building',
      // Graphics / Drawings
      'cartoon', 'anime', 'avatar', 'drawing', 'painting', 'sketch', 'clipart', 'illustration',
      // Religious & Non-road Photos
      'religious', 'god', 'deity', 'temple', 'mandir', 'pooja', 'idol', 'church', 'mosque', 'prayer',
      'krishna', 'radha', 'rani', 'shiva', 'jesus', 'buddha', 'ganesha',
      // Explicit invalid markers
      'invalid', 'non-road', 'nonroad', 'random', 'unrelated', 'fake', 'sample_id', 'dummy'
    ];

    const imageTokens = imageContext.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    const hasExplicitNonRoadKeyword = nonRoadKeywords.some((kw) => {
      if (kw.length <= 4 || ['person', 'human', 'face', 'setup', 'chest', 'torso', 'body', 'poster', 'product', 'interior', 'game', 'chess', 'board'].includes(kw)) {
        return imageTokens.includes(kw) || new RegExp(`\\b${kw}\\b`, 'i').test(imageContext);
      }
      return imageContext.includes(kw) || imageTokens.includes(kw);
    });

    // 3. Supported Road Damage Categories Detection strictly in Image Context
    const potholeKeywords = ['pothole', 'potholes', 'crater', 'cavity', 'depression', 'pavement_break', 'hole', 'road_hole', 'rut', 'rutting', 'pit', 'severepothole', 'deep_pothole'];
    const waterlogKeywords = ['waterlog', 'waterlogging', 'water-filled', 'water_logged', 'waterlogged', 'flood', 'flooded', 'puddle', 'ponding', 'standing_water', 'stormwater', 'submerged'];
    const crackKeywords = ['crack', 'cracks', 'cracking', 'fracture', 'fissure', 'surface_cracking', 'alligator'];
    const surfaceKeywords = ['surface_deterioration', 'surface-deterioration', 'surface_damage', 'raveling', 'ravelling', 'asphalt_peel', 'stripping', 'macadam'];
    const edgeKeywords = ['road-edge', 'road_edge', 'edge_drop', 'edge_dropping', 'shoulder_damage', 'shoulder_drop', 'scour', 'edge_damage', 'berm', 'curb_break', 'road_shoulder'];
    const drainKeywords = ['drain', 'drainage', 'gutter', 'manhole', 'culvert', 'catchbasin', 'storm_drain', 'sewer', 'chamber'];
    const generalRoadKeywords = [
      'asphalt', 'pavement', 'highway', 'street', 'lane', 'tar', 'bitumen', 'carriageway',
      'repaired-road', 'photo-1515162816999', 'unsplash', 'demo-evidence', 'severe-damage',
      'tarmac', 'roadway'
    ];

    const hasRoadWord = (/\broad\b/i).test(cleanFilename) || (/\broad\b/i).test(cleanUrl);
    const hasPotholeImage = potholeKeywords.some((kw) => imageContext.includes(kw));
    const hasWaterlogImage = waterlogKeywords.some((kw) => imageContext.includes(kw));
    const hasCrackImage = crackKeywords.some((kw) => imageContext.includes(kw));
    const hasSurfaceImage = surfaceKeywords.some((kw) => imageContext.includes(kw));
    const hasEdgeImage = edgeKeywords.some((kw) => imageContext.includes(kw));
    const hasDrainImage = drainKeywords.some((kw) => imageContext.includes(kw));
    const hasGeneralRoadImage = generalRoadKeywords.some((kw) => imageContext.includes(kw)) || hasRoadWord;

    const isRoadDamageImage = (hasPotholeImage || hasWaterlogImage || hasCrackImage || hasSurfaceImage || hasEdgeImage || hasDrainImage || hasGeneralRoadImage) && !hasExplicitNonRoadKeyword;

    // IF NOT VALID ROAD DAMAGE:
    // User text "pothole" or "water logging" must NEVER force classification if image is unrelated!
    // IMAGE ALWAYS WINS OVER TEXT!
    if (!isRoadDamageImage || hasExplicitNonRoadKeyword) {
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

    // VALID ROAD DAMAGE: Classify into one of 6 supported categories
    let damageType: AIAnalysisOutput['damageType'] = 'pothole';
    if (hasWaterlogImage) {
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
      // General road photo: check if a supported defect is specified in hints or description
      if (userText.includes('water') || userText.includes('flood') || userText.includes('puddle')) {
        damageType = 'waterlogging';
      } else if (userText.includes('crack') || userText.includes('fracture')) {
        damageType = 'crack';
      } else if (userText.includes('surface') || userText.includes('deterioration') || userText.includes('rough')) {
        damageType = 'surface_deterioration';
      } else if (userText.includes('edge') || userText.includes('shoulder')) {
        damageType = 'road_edge_damage';
      } else if (userText.includes('drain') || userText.includes('manhole')) {
        damageType = 'drainage_damage';
      } else if (userText.includes('pothole') || userText.includes('crater') || userText.includes('cavity') || userText.includes('pit')) {
        damageType = 'pothole';
      } else {
        // Ambiguous / uncertain road image without verified defect:
        // Do NOT force Pothole! Do NOT invent 90% confidence!
        return {
          validRoadDamage: false,
          classification: 'INVALID_EVIDENCE',
          damageType: 'other',
          severity: 'low',
          confidence: 0,
          visibleDamage: false,
          roadSafetyRisk: 0,
          description: 'UNCERTAIN ROAD EVIDENCE: The uploaded photograph does not show an identifiable supported road-safety defect (Pothole, Water Logging, Surface Cracking, Edge Dropping, or Drain/Manhole Damage).',
          recommendedAction: 'No civil action required. Verification failed due to ambiguous evidence.',
          cancellationReason: 'Image evidence is ambiguous or does not show a supported road defect.',
          imageQuality: {
            isAcceptable: false,
            isBlurry: false,
            isTooDark: false,
            hasRoadVisible: true,
            qualityScore: 30,
            warningMessage: 'Ambiguous road surface evidence. No supported defect verified.',
          },
        };
      }
    }

    // Deterministic severity and roadSafetyRisk based on image defect and stable fingerprint
    let hashVal = 0;
    for (let i = 0; i < imageContext.length; i++) {
      hashVal = ((hashVal << 5) - hashVal) + imageContext.charCodeAt(i);
      hashVal |= 0;
    }
    hashVal = Math.abs(hashVal);

    let severity: AIAnalysisOutput['severity'] = 'medium';
    let roadSafetyRisk = 55;
    let confidence = 0.88;

    if (damageType === 'pothole') {
      if (imageContext.includes('deep') || imageContext.includes('crater') || imageContext.includes('severe') || imageContext.includes('critical')) {
        severity = 'critical';
        roadSafetyRisk = 88;
        confidence = 0.94;
      } else if (imageContext.includes('cluster') || imageContext.includes('multiple') || imageContext.includes('potholes')) {
        severity = 'high';
        roadSafetyRisk = 78;
        confidence = 0.91;
      } else if (imageContext.includes('minor') || imageContext.includes('small') || imageContext.includes('shallow')) {
        severity = 'medium';
        roadSafetyRisk = 55;
        confidence = 0.86;
      } else {
        // Deterministic analysis from stable image fingerprint (never Math.random() or timestamps)
        // Same image -> identical hashVal -> identical severity & risk
        // Different images -> differing hashVal -> dynamically differing risk
        const variants = [
          { severity: 'high' as const, roadSafetyRisk: 74, confidence: 0.90 },
          { severity: 'medium' as const, roadSafetyRisk: 62, confidence: 0.88 },
          { severity: 'critical' as const, roadSafetyRisk: 86, confidence: 0.93 },
          { severity: 'high' as const, roadSafetyRisk: 70, confidence: 0.89 },
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
        overallConfidence: 5,
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
