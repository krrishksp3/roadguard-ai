import React from 'react';
import { StatusTimelineEvent, ComplaintStatus } from '../../../../shared/types';
import { CheckCircle, Circle, Clock, Wrench, ShieldCheck, AlertCircle } from 'lucide-react';

interface ComplaintTimelineProps {
  timeline: StatusTimelineEvent[];
  currentStatus: ComplaintStatus;
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ timeline, currentStatus }) => {
  const steps = [
    { key: 'REPORTED', label: 'Report Created' },
    { key: 'AI_ANALYZED', label: 'AI Analyzed' },
    { key: 'ASSIGNED', label: 'Department Assigned' },
    { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { key: 'INSPECTION_SCHEDULED', label: 'Field Inspection' },
    { key: 'REPAIR_IN_PROGRESS', label: 'Repair in Progress' },
    { key: 'AI_VERIFIED', label: 'AI Verified' },
    { key: 'RESOLVED', label: 'Resolved' },
  ];

  const getStepStatus = (stepKey: string) => {
    const event = timeline.find((e) => e.status === stepKey);
    if (event) return { status: 'completed', event };
    if (currentStatus === 'NEEDS_REINSPECTION' && stepKey === 'RESOLVED') {
      return { status: 'rejected', event: null };
    }
    return { status: 'pending', event: null };
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center space-x-2">
        <Clock className="w-4 h-4 text-gov-700" />
        <span>Action Lifecycle Tracking</span>
      </h3>

      {/* Horizontal milestone bar for desktop */}
      <div className="hidden md:flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
        {steps.map((step, idx) => {
          const { status } = getStepStatus(step.key);
          const isDone = status === 'completed';
          const isCurrent = currentStatus === step.key;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-gov-700 border-gov-700 text-white ring-4 ring-gov-100'
                    : 'bg-white border-slate-300 text-slate-300'
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4" />
                ) : isCurrent ? (
                  <Wrench className="w-4 h-4 animate-spin" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
              </div>
              <span
                className={`text-[11px] mt-2 font-medium max-w-[80px] text-center ${
                  isDone || isCurrent ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detailed event log */}
      <div className="space-y-4 border-t border-slate-100 pt-4">
        {timeline.map((event, idx) => (
          <div key={event.id || idx} className="flex space-x-3 text-sm">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-gov-700 mt-1.5"></div>
              {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1"></div>}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{event.label}</span>
                <span className="text-xs text-slate-400">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
              {event.actorName && (
                <span className="text-[11px] text-slate-400 inline-block mt-1 font-mono">
                  By: {event.actorName} ({event.actorRole})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
