import React from 'react';
import { PriorityAssessment, getRiskLevelFromScore } from '../../../../shared/types';
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RiskScoreMeterProps {
  score: number;
  priorityAssessment?: PriorityAssessment;
  compact?: boolean;
}

export const RiskScoreMeter: React.FC<RiskScoreMeterProps> = ({ score, priorityAssessment, compact = false }) => {
  const riskLevel = getRiskLevelFromScore(score);

  let color = 'text-green-600 bg-green-50 border-green-200';
  let barColor = 'bg-green-500';
  let label = 'LOW RISK';

  if (score <= 0) {
    color = 'text-slate-600 bg-slate-50 border-slate-200';
    barColor = 'bg-slate-300';
    label = 'NO RISK FOUND';
  } else if (riskLevel === 'CRITICAL') {
    color = 'text-red-700 bg-red-50 border-red-200';
    barColor = 'bg-red-600';
    label = 'CRITICAL RISK';
  } else if (riskLevel === 'HIGH') {
    color = 'text-orange-700 bg-orange-50 border-orange-200';
    barColor = 'bg-orange-500';
    label = 'HIGH RISK';
  } else if (riskLevel === 'MEDIUM') {
    color = 'text-amber-700 bg-amber-50 border-amber-200';
    barColor = 'bg-amber-500';
    label = 'MEDIUM RISK';
  }

  if (compact) {
    if (score <= 0) {
      return (
        <div className="flex items-center space-x-2">
          <div className="px-2 py-0.5 rounded font-bold text-[11px] border bg-slate-100 text-slate-700 border-slate-200">
            NO RISK FOUND
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <div className={`px-2 py-0.5 rounded font-bold text-xs border ${color}`}>
          {score}/100
        </div>
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
    );
  }

  let explanations: string[] = [];
  if (priorityAssessment?.explanation) {
    try {
      explanations = typeof priorityAssessment.explanation === 'string'
        ? JSON.parse(priorityAssessment.explanation)
        : priorityAssessment.explanation;
    } catch {
      explanations = [String(priorityAssessment.explanation)];
    }
  }

  return (
    <div className={`p-4 rounded-xl border ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {score <= 0 ? (
            <CheckCircle2 className="w-5 h-5 text-slate-500" />
          ) : riskLevel === 'CRITICAL' ? (
            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
          ) : riskLevel === 'HIGH' ? (
            <ShieldAlert className="w-5 h-5 text-orange-600" />
          ) : riskLevel === 'MEDIUM' ? (
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        </div>
        {score <= 0 ? (
          <span className="text-sm font-bold text-slate-600">N/A (No Hazard)</span>
        ) : (
          <span className="text-2xl font-extrabold">{score} <span className="text-sm font-normal text-slate-500">/ 100</span></span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-3 overflow-hidden">
        <div className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.max(0, score)}%` }}></div>
      </div>

      {/* Explanations & Factor Breakdown */}
      {explanations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-700">
          <p className="font-semibold text-slate-900 mb-1">Key Analytical Risk Factors:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {explanations.map((exp, idx) => (
              <li key={idx}>{exp}</li>
            ))}
          </ul>
        </div>
      )}

      {priorityAssessment?.breakdown && (
        <div className="mt-3 pt-2 grid grid-cols-3 gap-2 text-[10px] text-slate-600 bg-white/70 p-2 rounded-lg">
          <div>Severity: <span className="font-semibold text-slate-900">{priorityAssessment.breakdown.severityScore}</span></div>
          <div>Safety Risk: <span className="font-semibold text-slate-900">{priorityAssessment.breakdown.safetyRiskScore}</span></div>
          <div>Density: <span className="font-semibold text-slate-900">{priorityAssessment.breakdown.densityScore}</span></div>
          <div>Corridor: <span className="font-semibold text-slate-900">{priorityAssessment.breakdown.roadImportanceScore}</span></div>
          <div>Recurrence: <span className="font-semibold text-slate-900">{priorityAssessment.breakdown.recurrenceScore}</span></div>
          <div>SLA Urgency: <span className="font-semibold text-slate-900">{priorityAssessment.breakdown.slaUrgencyScore}</span></div>
        </div>
      )}
    </div>
  );
};
