import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TenderRecord } from '../../../shared/types';
import { FileText, ExternalLink, ShieldCheck, Building, CheckCircle2, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export const TenderIntelligencePage: React.FC = () => {
  const { dict: t } = useLanguage();
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
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 bg-white border border-slate-200 shadow-subtle px-3 py-1 rounded-full text-xs font-bold text-teal-800 mb-2">
            <FileText className="w-3.5 h-3.5 text-teal-600" />
            <span>{t.tenders.procurementLayer}</span>
            <span>•</span>
            <span>{t.tenders.accountability}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-ink-950 tracking-tight uppercase">
            {t.tenders.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            {t.tenders.pageSubtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
            {t.tenders.demoBadge}
          </span>
        </div>
      </div>

      {/* Honest Prototype Transparency Banner */}
      <div className="p-4 bg-warm-100 border border-slate-200 rounded-2xl flex items-start space-x-3 text-xs text-slate-600">
        <Info className="w-5 h-5 text-teal-700 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold text-ink-950 block">{t.tenders.bannerTitle}</span>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            {t.tenders.bannerText}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">{t.tenders.loading}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tenders.map((tender) => (
            <div
              key={tender.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-card flex flex-col justify-between space-y-4 card-hover"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                    {tender.tenderId}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      tender.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {tender.verificationStatus}
                  </span>
                </div>

                <div>
                  <h3 className="font-black font-heading text-ink-950 text-base sm:text-lg">
                    {tender.roadName}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ref No: {tender.tenderRefNumber}</p>
                </div>

                <div className="bg-warm-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-ink-950 block mb-0.5">{t.tenders.scopeLabel}</span>
                  {tender.workDescription}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-warm-100 p-3 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t.tenders.sanctionedValue}</span>
                    <span className="font-bold text-teal-700 text-sm">{tender.tenderValue}</span>
                  </div>
                  <div className="bg-warm-100 p-3 rounded-2xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{t.tenders.executionPeriod}</span>
                    <span className="font-semibold text-ink-950">{tender.workPeriod}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1.5 pt-1">
                  <div className="flex items-start space-x-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">{t.tenders.invitingAuthority}</span>
                      <span className="text-slate-800 font-medium">{tender.invitingAuthority}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">{t.tenders.awardedContractor}</span>
                    <span className="font-semibold text-ink-950">{tender.contractor}</span>
                    <span className="text-[10px] text-slate-400 font-mono block italic">
                      {t.tenders.contractorStatus} {tender.contractorStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  {t.tenders.archivedDate} {tender.sourceDate}
                </span>
                <a
                  href={tender.officialSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 hover:text-teal-800 font-extrabold flex items-center space-x-1"
                >
                  <span>{t.tenders.portalArchive}</span>
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
