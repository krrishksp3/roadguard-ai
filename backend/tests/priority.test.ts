import { RoadRiskEngine, getRiskLevelFromScore } from '../src/services/priority/riskEngine';

describe('RoadRiskEngine', () => {
  it('should calculate critical risk for severe deep pothole on arterial corridor', () => {
    const result = RoadRiskEngine.calculate({
      severity: 'critical',
      roadSafetyRisk: 90,
      aiConfidence: 0.95,
      nearbyReportsCount: 3,
      roadImportance: 'ARTERIAL',
      isRecurringHotspot: true,
      roadHealthScore: 40,
      hoursSinceReported: 30,
      slaTargetHours: 24,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.riskLevel).toBe('CRITICAL');
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.breakdown.severityScore).toBeGreaterThan(0);
    expect(result.breakdown.safetyRiskScore).toBeGreaterThan(0);
  });

  it('should calculate low risk for minor cracks on local road', () => {
    const result = RoadRiskEngine.calculate({
      severity: 'low',
      roadSafetyRisk: 25,
      aiConfidence: 0.85,
      nearbyReportsCount: 0,
      roadImportance: 'LOCAL',
      isRecurringHotspot: false,
      roadHealthScore: 90,
      hoursSinceReported: 2,
      slaTargetHours: 240,
    });

    expect(result.overallScore).toBeLessThan(50);
    expect(['LOW', 'MEDIUM']).toContain(result.riskLevel);
  });

  it('should strictly follow the fixed category threshold rule', () => {
    // 0 - 39.99 = LOW
    expect(getRiskLevelFromScore(0)).toBe('LOW');
    expect(getRiskLevelFromScore(39)).toBe('LOW');
    expect(getRiskLevelFromScore(39.9)).toBe('LOW');

    // 40 - 49.99 = MEDIUM
    expect(getRiskLevelFromScore(40)).toBe('MEDIUM');
    expect(getRiskLevelFromScore(45)).toBe('MEDIUM');
    expect(getRiskLevelFromScore(48)).toBe('MEDIUM');
    expect(getRiskLevelFromScore(49)).toBe('MEDIUM');
    expect(getRiskLevelFromScore(49.9)).toBe('MEDIUM');

    // 50 - 75 = HIGH
    expect(getRiskLevelFromScore(50)).toBe('HIGH');
    expect(getRiskLevelFromScore(52)).toBe('HIGH');
    expect(getRiskLevelFromScore(70)).toBe('HIGH');
    expect(getRiskLevelFromScore(74)).toBe('HIGH');
    expect(getRiskLevelFromScore(75)).toBe('HIGH');

    // 76 - 100 = CRITICAL
    expect(getRiskLevelFromScore(76)).toBe('CRITICAL');
    expect(getRiskLevelFromScore(85)).toBe('CRITICAL');
    expect(getRiskLevelFromScore(91)).toBe('CRITICAL');
    expect(getRiskLevelFromScore(100)).toBe('CRITICAL');
  });

  it('should produce 100% deterministic score and category for identical inputs', () => {
    const input = {
      severity: 'high',
      roadSafetyRisk: 72,
      aiConfidence: 0.90,
      nearbyReportsCount: 0,
      roadImportance: 'MAJOR_DISTRICT',
      isRecurringHotspot: false,
      roadHealthScore: 70,
      hoursSinceReported: 0,
      slaTargetHours: 48,
    };

    const res1 = RoadRiskEngine.calculate(input);
    const res2 = RoadRiskEngine.calculate(input);
    const res3 = RoadRiskEngine.calculate(input);

    expect(res1.overallScore).toBe(res2.overallScore);
    expect(res2.overallScore).toBe(res3.overallScore);
    expect(res1.riskLevel).toBe(res2.riskLevel);
    expect(res2.riskLevel).toBe(res3.riskLevel);
  });

  describe('Risk Engine Hard Preconditions — Rejected Classes & Negative Gates', () => {
    it('strictly returns riskScore 0 and aborts calculation for NO_DAMAGE_FOUND', () => {
      const result = RoadRiskEngine.calculate({
        damageDetected: false,
        damageType: 'NO_ROAD_DAMAGE',
        classification: 'NO_DAMAGE_FOUND',
        severity: 'NONE',
        roadSafetyRisk: 0,
        aiConfidence: 0,
        nearbyReportsCount: 0,
        roadImportance: 'MAJOR_DISTRICT',
        isRecurringHotspot: false,
        roadHealthScore: 70,
        hoursSinceReported: 0,
        slaTargetHours: 0,
      });

      expect(result.overallScore).toBe(0);
      expect(result.riskLevel).toBe('LOW');
      expect(result.breakdown.severityScore).toBe(0);
      expect(result.breakdown.safetyRiskScore).toBe(0);
      expect(result.explanation[0]).toContain('NO ROAD DAMAGE VERIFIED');
    });

    it('strictly returns riskScore 0 for NON_ROAD_IMAGE', () => {
      const result = RoadRiskEngine.calculate({
        damageDetected: false,
        damageType: 'NON_ROAD_IMAGE',
        classification: 'NON_ROAD_IMAGE',
        severity: 'NONE',
        roadSafetyRisk: 0,
        aiConfidence: 0,
        nearbyReportsCount: 0,
        roadImportance: 'HIGHWAY',
        isRecurringHotspot: true,
        roadHealthScore: 30,
        hoursSinceReported: 10,
        slaTargetHours: 24,
      });

      expect(result.overallScore).toBe(0);
      expect(result.riskLevel).toBe('LOW');
    });

    it('strictly returns riskScore 0 for INSUFFICIENT_EVIDENCE', () => {
      const result = RoadRiskEngine.calculate({
        damageDetected: false,
        damageType: 'INSUFFICIENT_EVIDENCE',
        classification: 'INSUFFICIENT_EVIDENCE',
        severity: 'NONE',
        roadSafetyRisk: 0,
        aiConfidence: 0,
        nearbyReportsCount: 0,
        roadImportance: 'ARTERIAL',
        isRecurringHotspot: false,
        roadHealthScore: 60,
        hoursSinceReported: 0,
        slaTargetHours: 48,
      });

      expect(result.overallScore).toBe(0);
    });

    it('strictly returns riskScore 0 if damageDetected is false even if other fields are populated', () => {
      const result = RoadRiskEngine.calculate({
        damageDetected: false,
        damageType: 'POTHOLE',
        severity: 'critical',
        roadSafetyRisk: 85,
        aiConfidence: 0.9,
        nearbyReportsCount: 2,
        roadImportance: 'HIGHWAY',
        isRecurringHotspot: true,
        roadHealthScore: 40,
        hoursSinceReported: 0,
        slaTargetHours: 24,
      });

      expect(result.overallScore).toBe(0);
    });
  });
});
