import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gov-700 flex items-center justify-center text-white">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="font-heading font-bold text-slate-200">ROADGUARD AI</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Team YuvaTech • Smart India Hackathon 2026</span>
        </div>
        <p className="text-center md:text-right text-slate-500">
          From Road Complaints to Intelligent, Accountable Road Action. All public tender & road records are prototype references.
        </p>
      </div>
    </footer>
  );
};
