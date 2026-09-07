import { AIProvider, DamageAnalysisInput, VerificationInput } from './AIProvider';
import { AIAnalysisOutput, AIVerificationOutput } from './schemas';

export class DemoAIProvider implements AIProvider {
  name = 'DemoAIProvider (Offline/Hackathon Mode)';

  async analyzeRoadDamage(input: DamageAnalysisInput): Promise<AIAnalysisOutput> {
    const text = (input.description + ' ' + (input.damageTypeHint || '')).toLowerCase();

    // Damage type heuristic detection
    let damageType: AIAnalysisOutput['damageType'] = 'pothole';
    if (text.includes('crack') || text.includes('fracture') || text.includes('fissure')) {
      damageType = 'crack';
    } else if (text.includes('water') || text.includes('flood') || text.includes('waterlog')) {
      damageType = 'waterlogging';
    } else if (text.includes('edge') || text.includes('shoulder') || text.includes('curb')) {
      damageType = 'road_edge_damage';
    } else if (text.includes('drain') || text.includes('gutter') || text.includes('manhole')) {
      damageType = 'drainage_damage';
    } else if (text.includes('sign') || text.includes('board') || text.includes('marker')) {
      damageType = 'signage_damage';
    } else if (text.includes('surface') || text.includes('rough') || text.includes('asphalt') || text.includes('tar')) {
      damageType = 'surface_deterioration';
    }

    // Severity assessment
    let severity: AIAnalysisOutput['severity'] = 'medium';
    let roadSafetyRisk = 55;
    let confidence = 0.88;

    if (text.includes('deep') || text.includes('huge') || text.includes('large') || text.includes('severe') || text.includes('accident') || text.includes('danger') || text.includes('critical')) {
      severity = 'critical';
      roadSafetyRisk = 88;
      confidence = 0.94;
    } else if (text.includes('high') || text.includes('broken') || text.includes('big') || text.includes('bad') || text.includes('heavy')) {
      severity = 'high';
      roadSafetyRisk = 76;
      confidence = 0.91;
    } else if (text.includes('small') || text.includes('minor') || text.includes('slight')) {
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
    // Deterministic civil inspection comparison
    const isMajor = input.originalSeverity === 'critical' || input.originalSeverity === 'high';
    
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
