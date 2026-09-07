export interface RiskCalculationInput {
  severity: string; // 'low' | 'medium' | 'high' | 'critical'
  roadSafetyRisk: number; // 0 - 100 (from AI)
  aiConfidence: number; // 0.0 - 1.0
  nearbyReportsCount: number; // nearby clustering
  roadImportance: string; // 'HIGHWAY' | 'ARTERIAL' | 'MAJOR_DISTRICT' | 'LOCAL'
  isRecurringHotspot: boolean;
  roadHealthScore: number; // 0 - 100 (lower health = higher risk)
  hoursSinceReported: number;
  slaTargetHours: number;
}

export interface RiskCalculationResult {
  overallScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: {
    severityScore: number;
    safetyRiskScore: number;
    densityScore: number;
    roadImportanceScore: number;
    recurrenceScore: number;
    slaUrgencyScore: number;
  };
  explanation: string[];
}

export class RoadRiskEngine {
  // Configurable weights totaling 100
  private static WEIGHTS = {
    SEVERITY: 25,
    SAFETY_RISK: 20,
    ROAD_IMPORTANCE: 20,
    DENSITY: 15,
    RECURRENCE: 10,
    SLA_URGENCY: 10,
  };

  public static calculate(input: RiskCalculationInput): RiskCalculationResult {
    const explanations: string[] = [];

    // 1. Severity Score (0 - 100 scaled to WEIGHTS.SEVERITY)
    let severityBase = 25;
    if (input.severity === 'critical') severityBase = 100;
    else if (input.severity === 'high') severityBase = 75;
    else if (input.severity === 'medium') severityBase = 50;
    const severityScore = (severityBase / 100) * this.WEIGHTS.SEVERITY;
    if (input.severity === 'critical' || input.severity === 'high') {
      explanations.push(`High pavement failure severity (${input.severity.toUpperCase()}) poses hazard to vehicular flow.`);
    }

    // 2. AI Road Safety Risk (0 - 100 scaled to WEIGHTS.SAFETY_RISK)
    const safetyRiskScore = ((input.roadSafetyRisk * (input.aiConfidence || 0.85)) / 100) * this.WEIGHTS.SAFETY_RISK;
    if (input.roadSafetyRisk >= 70) {
      explanations.push(`High direct collision/skid hazard index (${input.roadSafetyRisk}/100) identified by computer vision.`);
    }

    // 3. Road Importance (0 - 100 scaled to WEIGHTS.ROAD_IMPORTANCE)
    let importanceBase = 40;
    if (input.roadImportance === 'HIGHWAY') importanceBase = 100;
    else if (input.roadImportance === 'ARTERIAL') importanceBase = 85;
    else if (input.roadImportance === 'MAJOR_DISTRICT') importanceBase = 65;
    const roadImportanceScore = (importanceBase / 100) * this.WEIGHTS.ROAD_IMPORTANCE;
    if (input.roadImportance === 'HIGHWAY' || input.roadImportance === 'ARTERIAL') {
      explanations.push(`Critical arterial transit corridor (${input.roadImportance}) with high passenger density.`);
    }

    // 4. Report Density (Nearby Clustering) (0 - 100 scaled to WEIGHTS.DENSITY)
    // 0 reports = 10, 1 report = 35, 3+ reports = 75, 6+ reports = 100
    let densityBase = Math.min(100, Math.max(10, input.nearbyReportsCount * 25));
    const densityScore = (densityBase / 100) * this.WEIGHTS.DENSITY;
    if (input.nearbyReportsCount >= 2) {
      explanations.push(`Cluster detected: ${input.nearbyReportsCount} reports registered within 150m radius.`);
    }

    // 5. Recurrence Score (0 - 100 scaled to WEIGHTS.RECURRENCE)
    let recurrenceBase = input.isRecurringHotspot ? 100 : 20;
    if (input.roadHealthScore < 50) recurrenceBase = Math.max(recurrenceBase, 80);
    const recurrenceScore = (recurrenceBase / 100) * this.WEIGHTS.RECURRENCE;
    if (input.isRecurringHotspot) {
      explanations.push(`Chronic failure zone: Pavement section has experienced repeated damage within past 12 months.`);
    }

    // 6. SLA Urgency / Age (0 - 100 scaled to WEIGHTS.SLA_URGENCY)
    const slaRatio = input.slaTargetHours > 0 ? input.hoursSinceReported / input.slaTargetHours : 0;
    let slaBase = Math.min(100, Math.round(slaRatio * 100));
    const slaUrgencyScore = (slaBase / 100) * this.WEIGHTS.SLA_URGENCY;
    if (slaRatio >= 0.8) {
      explanations.push(`SLA threshold imminent or exceeded (Reported ${Math.round(input.hoursSinceReported)}h ago).`);
    }

    // Total Score calculation (clamped between 0 and 100)
    const rawTotal =
      severityScore +
      safetyRiskScore +
      roadImportanceScore +
      densityScore +
      recurrenceScore +
      slaUrgencyScore;
    
    const overallScore = Math.min(100, Math.max(1, Math.round(rawTotal)));

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (overallScore >= 80) riskLevel = 'CRITICAL';
    else if (overallScore >= 65) riskLevel = 'HIGH';
    else if (overallScore >= 45) riskLevel = 'MEDIUM';

    if (explanations.length === 0) {
      explanations.push('Standard localized road wear requiring scheduled routine maintenance.');
    }

    return {
      overallScore,
      riskLevel,
      breakdown: {
        severityScore: Math.round(severityScore * 10) / 10,
        safetyRiskScore: Math.round(safetyRiskScore * 10) / 10,
        densityScore: Math.round(densityScore * 10) / 10,
        roadImportanceScore: Math.round(roadImportanceScore * 10) / 10,
        recurrenceScore: Math.round(recurrenceScore * 10) / 10,
        slaUrgencyScore: Math.round(slaUrgencyScore * 10) / 10,
      },
      explanation: explanations,
    };
  }
}
