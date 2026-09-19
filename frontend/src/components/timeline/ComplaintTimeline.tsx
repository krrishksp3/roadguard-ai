import React from 'react';
import { StatusTimelineEvent, ComplaintStatus } from '../../../../shared/types';
import { CheckCircle, Circle, Clock, Wrench, ShieldCheck, AlertCircle } from 'lucide-react';

interface ComplaintTimelineProps {
  timeline: StatusTimelineEvent[];
  currentStatus: ComplaintStatus;
}

export const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ timeline, currentStatus }) => {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-rose-50/80 rounded-xl p-5 border border-rose-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-rose-900">
            Intake Validation — Report Cancelled
          </h3>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-rose-200/80 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-700 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Step 1: Report Submitted by Citizen</span>
          </div>
          <div className="flex items-center space-x-2 text-rose-700 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Step 2: Image Validation → INVALID EVIDENCE (Intake Stopped)</span>
          </div>
        </div>
        <p className="text-xs text-rose-700">
          No supported road damage was detected in the uploaded evidence. Complaint stopped at intake and not dispatched to road authority.
        </p>
      </div>
    );
  }

  const stages = [
    { key: 'REPORTED', label: 'REPORTED', matches: ['REPORTED'] },
    { key: 'AI_ANALYSIS', label: 'AI ANALYSIS', matches: ['AI_ANALYZED'] },
    { key: 'ASSIGNED', label: 'ASSIGNED', matches: ['ASSIGNED', 'ACKNOWLEDGED'] },
    { key: 'ACTION_IN_PROGRESS', label: 'ACTION IN PROGRESS', matches: ['INSPECTION_SCHEDULED', 'REPAIR_IN_PROGRESS'] },
    { key: 'VERIFICATION', label: 'VERIFICATION', matches: ['AI_VERIFIED', 'NEEDS_REINSPECTION'] },
    { key: 'RESOLVED', label: 'RESOLVED', matches: ['RESOLVED'] },
  ];

  // Map status to active stage index
  const getActiveStageIndex = (status: ComplaintStatus) => {
    switch (status) {
      case 'REPORTED': return 0;
      case 'AI_ANALYZED': return 1;
      case 'ASSIGNED':
      case 'ACKNOWLEDGED': return 2;
      case 'INSPECTION_SCHEDULED':
      case 'REPAIR_IN_PROGRESS': return 3;
      case 'AI_VERIFIED':
      case 'NEEDS_REINSPECTION': return 4;
      case 'RESOLVED': return 5;
      default: return 0;
    }
  };

  const activeIdx = getActiveStageIndex(currentStatus);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gov-700" />
          <span>REPORT TRACKING TIMELINE</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">Live Resolution Feed</span>
      </div>

      {/* 6-Stage Milestone Flow (Responsive) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
        {stages.map((stage, idx) => {
          const isDone = idx < activeIdx || currentStatus === 'RESOLVED';
          const isCurrent = idx === activeIdx && currentStatus !== 'RESOLVED';

          const matchingEvent = timeline.find((e) => stage.matches.includes(e.status));

          return (
            <div
              key={stage.key}
              className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-1.5 ${
                isDone
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                  : isCurrent
                  ? 'bg-gov-50 border-gov-500 text-gov-950 ring-2 ring-gov-200'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider">
                  {isDone ? '✓' : isCurrent ? '●' : '○'}
                </span>
                <span className="text-[9px] font-mono opacity-70">
                  {matchingEvent
                    ? new Date(matchingEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </div>
              <span className="text-[11px] font-black font-heading leading-tight block">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event history log */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Activity Log
        </span>
        {timeline.map((event, idx) => (
          <div key={event.id || idx} className="flex space-x-3 text-xs">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-gov-700 mt-1"></div>
              {idx < timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1"></div>}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{event.label}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">{event.description}</p>
              {event.actorName && (
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  Action by: {event.actorName} ({event.actorRole})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
