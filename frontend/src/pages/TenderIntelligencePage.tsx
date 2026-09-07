import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TenderRecord } from '../../../shared/types';
import { FileText, ExternalLink, ShieldCheck, Building, CheckCircle2, AlertCircle } from 'lucide-react';

export const TenderIntelligencePage: React.FC = () => {
  const [tenders, setTenders] = useState<TenderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTenders();
        setTenders(data);
      } catch (err) {
        console.error('Failed to load tenders:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
            Public Procurement Accountability
          </span>
          <span className="text-xs text-slate-400">• UP e-Procurement Portal Index</span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading text-slate-900 mt-1">
          Tender & Contract Intelligence Layer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
          Linking road segments directly to publicly notified government tenders, scope of work, contractors, and defect liability periods.
          Data verified against UP State e-Procurement Gazette archives.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading procurement records...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenders.map((tender) => (
            <div
              key={tender.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gov-700 bg-gov-50 px-2.5 py-1 rounded-lg border border-gov-200">
                    {tender.tenderId}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      tender.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {tender.verificationStatus}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{tender.roadName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Ref No: {tender.tenderRefNumber}</p>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  <span className="font-semibold text-slate-900 block mb-0.5">Scope of Civil Work:</span>
                  {tender.workDescription}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Sanctioned Value</span>
                    <span className="font-bold text-slate-900 text-sm text-gov-700">{tender.tenderValue}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Execution Period</span>
                    <span className="font-semibold text-slate-900">{tender.workPeriod}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 pt-1">
                  <div className="flex items-start space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[11px] block">Inviting Authority</span>
                      <span className="text-slate-800 font-medium">{tender.invitingAuthority}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 text-[11px] block">Awarded Contractor</span>
                    <span className="font-semibold text-slate-900">{tender.contractor}</span>
                    <span className="text-[10px] text-slate-400 font-mono block italic">
                      Verification status: {tender.contractorStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Archived: {tender.sourceDate}
                </span>
                <a
                  href={tender.officialSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gov-700 hover:text-gov-800 font-semibold flex items-center space-x-1"
                >
                  <span>UP e-Procurement Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
