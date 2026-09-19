import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, MapPin, PlusCircle, Activity, FileText, Lock } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { dict } = useLanguage();

  return (
    <footer className="bg-ink-950 border-t border-ink-800 text-slate-400 text-xs py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-md">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-extrabold text-base text-white tracking-tight">ROADGUARD AI</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
                {dict.footer.initiativeBadge}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              {dict.footer.missionText}
            </p>
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 pt-1">
              <span className="font-semibold text-slate-300">{dict.footer.pwdOffice}</span>
              <span>•</span>
              <span className="text-teal-400 font-medium">{dict.footer.contactHelpline}</span>
              <span>•</span>
              <span>{dict.footer.helplineNumber}</span>
            </div>
          </div>

          {/* Quick Citizen Navigation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              {dict.footer.citizenServices}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/report" className="hover:text-teal-400 transition-colors flex items-center space-x-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
                  <span>{dict.landing.reportCta}</span>
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-teal-400 transition-colors flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{dict.nav.roadMap}</span>
                </Link>
              </li>
              <li>
                <Link to="/my-reports" className="hover:text-white transition-colors">
                  {dict.nav.myReports}
                </Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure & Administration */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              {dict.footer.authorityAdmin}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/road-health" className="hover:text-teal-400 transition-colors flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>{dict.nav.roadHealth}</span>
                </Link>
              </li>
              <li>
                <Link to="/tenders" className="hover:text-teal-400 transition-colors flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>{dict.nav.tenderIntelligence}</span>
                </Link>
              </li>
              <li>
                <Link to="/authority" className="hover:text-amber-400 transition-colors flex items-center space-x-1.5 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{dict.nav.authorityOps}</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Prototype Disclaimer */}
        <div className="pt-6 border-t border-ink-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>
            © 2026 ROADGUARD AI • {dict.footer.allRightsReserved}
          </p>
          <p className="text-slate-400 text-center sm:text-right">
            {dict.footer.poweredBy}
          </p>
        </div>
      </div>
    </footer>
  );
};
