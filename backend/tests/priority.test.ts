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

    // 50 - 74.99 = HIGH
    expect(getRiskLevelFromScore(50)).toBe('HIGH');
    expect(getRiskLevelFromScore(52)).toBe('HIGH');
    expect(getRiskLevelFromScore(70)).toBe('HIGH');
    expect(getRiskLevelFromScore(74)).toBe('HIGH');
    expect(getRiskLevelFromScore(74.9)).toBe('HIGH');

    // 75 - 100 = CRITICAL
    expect(getRiskLevelFromScore(75)).toBe('CRITICAL');
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
});
