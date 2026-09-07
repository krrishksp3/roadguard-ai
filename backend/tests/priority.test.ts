import { RoadRiskEngine } from '../src/services/priority/riskEngine';

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

    expect(result.overallScore).toBeGreaterThanOrEqual(80);
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
});
