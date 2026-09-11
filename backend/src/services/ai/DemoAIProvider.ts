import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIVerificationOutput } from './schemas';

export class DemoAIProvider implements AIProvider {
  name = 'DemoAIProvider (Offline/Hackathon Mode)';

  async analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput> {
    // 1. IMAGE CONTEXT IS PRIMARY SIGNAL
    // Extract clean image tokens: strip domain names and brand names like "roadguard" so host URLs NEVER match "road"!
    const cleanUrl = (input.imageUrl || '')
      .replace(/https?:\/\/[^\/]+/gi, '')
      .replace(/roadguard/gi, '')
      .toLowerCase();
    const cleanFilename = (input.imageFilename || '')
      .replace(/roadguard/gi, '')
      .toLowerCase();
    const imageContext = `${cleanFilename} ${cleanUrl}`;
    
    // User text is secondary context only
    const userText = (input.description || '').toLowerCase();

    // 2. Explicit Non-Road / Unrelated Subject Tokens
    const nonRoadKeywords = [
      'id_card', 'idcard', 'id-card', 'student', 'college', 'school', 'classroom',
      'aadhaar', 'adhaar', 'pan_card', 'pancard', 'license', 'certificate', 'marksheet',
      'admit_card', 'roll_no', 'campus', 'hall_ticket', 'document', 'doc', 'pdf',
      'screenshot', 'screen', 'display', 'paper', 'receipt', 'invoice', 'form',
      'textbook', 'notebook', 'resume', 'portrait', 'person', 'selfie', 'face', 'human',
      'boy', 'girl', 'man', 'woman', 'crowd', 'profile', 'people', 'friend', 'group',
      'cat', 'dog', 'pet', 'animal', 'bird', 'food', 'dish', 'meal', 'fruit', 'vegetable',
      'indoor', 'room', 'bed', 'sofa', 'furniture', 'office', 'laptop', 'phone', 'desk',
      'cartoon', 'anime', 'avatar', 'drawing', 'painting', 'sketch', 'invalid', 'non-road',
      'nonroad', 'radha', 'rani', 'krishna', 'god', 'deity', 'temple', 'mandir', 'pooja',
      'idol', 'random', 'unrelated', 'fake', 'sample_id', 'dummy'
    ];

    const hasExplicitNonRoadKeyword = nonRoadKeywords.some((kw) => imageContext.includes(kw));

    // 3. Supported Road Damage Categories Detection strictly in Image Context
    const potholeKeywords = ['pothole', 'crater', 'cavity', 'depression', 'pavement_break', 'potholes'];
    const waterlogKeywords = ['waterlog', 'water-filled', 'water_logged', 'flood', 'puddle', 'ponding', 'standing_water', 'waterlogging'];
    const crackKeywords = ['crack', 'fracture', 'fissure', 'surface_deterioration', 'surface-deterioration', 'raveling', 'alligator', 'asphalt_peel', 'stripping', 'macadam'];
    const edgeKeywords = ['road-edge', 'road_edge', 'edge_drop', 'shoulder_damage', 'shoulder_drop', 'scour', 'edge_damage', 'berm', 'curb_break'];
    const drainKeywords = ['drain', 'drainage', 'gutter', 'manhole', 'culvert', 'catchbasin', 'storm_drain', 'sewer'];
    const generalRoadKeywords = ['asphalt', 'pavement', 'highway', 'street', 'lane', 'tar', 'bitumen', 'carriageway', 'repaired-road', 'photo-1515162816999', 'unsplash'];

    const hasRoadWord = (/\broad\b/i).test(cleanFilename) || (/\broad\b/i).test(cleanUrl);
    const hasPotholeImage = potholeKeywords.some((kw) => imageContext.includes(kw));
    const hasWaterlogImage = waterlogKeywords.some((kw) => imageContext.includes(kw));
    const hasCrackImage = crackKeywords.some((kw) => imageContext.includes(kw));
    const hasEdgeImage = edgeKeywords.some((kw) => imageContext.includes(kw));
    const hasDrainImage = drainKeywords.some((kw) => imageContext.includes(kw));
    const hasGeneralRoadImage = generalRoadKeywords.some((kw) => imageContext.includes(kw)) || hasRoadWord;

    const isRoadDamageImage = (hasPotholeImage || hasWaterlogImage || hasCrackImage || hasEdgeImage || hasDrainImage || hasGeneralRoadImage) && !hasExplicitNonRoadKeyword;

    // IF NOT VALID ROAD DAMAGE:
    // User text "pothole" or "water logging" must NEVER force classification if image is unrelated!
    if (!isRoadDamageImage || hasExplicitNonRoadKeyword) {
      return {
        validRoadDamage: false,
        classification: 'INVALID_EVIDENCE',
        damageType: 'other',
        severity: 'low',
        confidence: 0,
        visibleDamage: false,
        roadSafetyRisk: 0,
        description: 'INVALID ROAD-DAMAGE EVIDENCE: The uploaded photograph does not appear to show a supported road-safety issue (Pothole, Water Logging, Surface Cracking, Edge Dropping, or Drain/Manhole Damage).',
        recommendedAction: 'No civil action required. Report cancelled at intake due to invalid evidence.',
        cancellationReason: 'The uploaded photograph is not related to a supported road-damage category.',
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

    // VALID ROAD DAMAGE: Classify into one of 5 supported categories
    let damageType: AIAnalysisOutput['damageType'] = 'pothole';
    if (hasWaterlogImage) {
      damageType = 'waterlogging';
    } else if (hasCrackImage) {
      damageType = imageContext.includes('surface') ? 'surface_deterioration' : 'crack';
    } else if (hasEdgeImage) {
      damageType = 'road_edge_damage';
    } else if (hasDrainImage) {
      damageType = 'drainage_damage';
    } else if (hasPotholeImage) {
      damageType = 'pothole';
    } else {
      // If general road image, use secondary user text to clarify defect
      if (userText.includes('water') || userText.includes('flood')) {
        damageType = 'waterlogging';
      } else if (userText.includes('crack') || userText.includes('fracture')) {
        damageType = 'crack';
      } else if (userText.includes('surface') || userText.includes('rough')) {
        damageType = 'surface_deterioration';
      } else if (userText.includes('edge') || userText.includes('shoulder')) {
        damageType = 'road_edge_damage';
      } else if (userText.includes('drain') || userText.includes('manhole')) {
        damageType = 'drainage_damage';
      } else {
        damageType = 'pothole';
      }
    }

    // Severity assessment
    let severity: AIAnalysisOutput['severity'] = 'medium';
    let roadSafetyRisk = 55;
    let confidence = 0.88;

    const fullText = (userText + ' ' + imageContext);
    if (fullText.includes('deep') || fullText.includes('huge') || fullText.includes('large') || fullText.includes('severe') || fullText.includes('accident') || fullText.includes('danger') || fullText.includes('critical')) {
      severity = 'critical';
      roadSafetyRisk = 88;
      confidence = 0.94;
    } else if (fullText.includes('high') || fullText.includes('broken') || fullText.includes('big') || fullText.includes('bad') || fullText.includes('heavy')) {
      severity = 'high';
      roadSafetyRisk = 76;
      confidence = 0.91;
    } else if (fullText.includes('small') || fullText.includes('minor') || fullText.includes('slight')) {
      severity = 'low';
      roadSafetyRisk = 32;
      confidence = 0.84;
    } else {
      if (damageType === 'pothole') {
        severity = 'high';
        roadSafetyRisk = 72;
      } else if (damageType === 'waterlogging') {
        severity = 'high';
        roadSafetyRisk = 80;
      }
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

    // Check if after image is identical to before (no work done) or contains non-road content
    const nonRoadKeywords = [
      'id_card', 'idcard', 'student', 'classroom', 'aadhaar', 'license', 'certificate',
      'person', 'selfie', 'food', 'animal', 'indoor', 'screenshot', 'document',
      'invalid', 'unrelated', 'fake'
    ];
    const isMismatched = nonRoadKeywords.some((kw) => after.includes(kw)) || (after && before && after === before);

    if (isMismatched) {
      return {
        locationMatchConfidence: 22,
        visibleImprovementScore: 18,
        remainingDamageScore: 82,
        overallConfidence: 91,
        recommendation: 'NEEDS_REINSPECTION',
        explanation: 'IMAGE EVIDENCE MISMATCH: Uploaded after-repair evidence does not match the geographic pavement location or features of the reported defect. Remediation cannot be established. Formal closure blocked; site re-inspection required.',
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
