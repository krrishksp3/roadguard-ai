import React from 'react';
import { ComplaintStatus, SeverityLevel } from '../../../../shared/types';
import { useLanguage } from '../../i18n/LanguageContext';

export const StatusBadge: React.FC<{ status: ComplaintStatus | string }> = ({ status }) => {
  const { language, getStatusExplanation } = useLanguage();

  const getStyle = () => {
    switch (status) {
      case 'REPORTED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AI_ANALYZED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ASSIGNED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'ACKNOWLEDGED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INSPECTION_SCHEDULED':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'REPAIR_IN_PROGRESS':
        return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'REPAIR_COMPLETED':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'AI_VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-300 font-semibold';
      case 'NEEDS_REINSPECTION':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const explanation = getStatusExplanation(status);
  const technicalLabel = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyle()}`}
      title={explanation}
    >
      <span className="font-bold tracking-tight">{technicalLabel}</span>
      {language === 'hi' && explanation && (
        <span className="font-normal text-[11px] opacity-90 border-l border-current/20 pl-1.5">
          {explanation}
        </span>
      )}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel | string }> = ({ severity }) => {
  const { language, getSeverityLabel } = useLanguage();
  const s = severity.toLowerCase();
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  if (s === 'critical') style = 'bg-red-100 text-red-800 border-red-300';
  else if (s === 'high') style = 'bg-orange-100 text-orange-800 border-orange-300';
  else if (s === 'medium') style = 'bg-yellow-100 text-yellow-800 border-yellow-300';
  else if (s === 'low') style = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  const localized = getSeverityLabel(severity);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${style}`}
      title={localized}
    >
      <span>{severity}</span>
      {language === 'hi' && localized && (
        <span className="font-normal text-[11px] normal-case border-l border-current/20 pl-1">
          {localized}
        </span>
      )}
    </span>
  );
};
