import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'navbar' | 'mobile';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'navbar' }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className="flex items-center justify-between p-3 bg-ink-900/90 rounded-2xl border border-ink-800 text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <Globe className="w-4 h-4 text-teal-400" />
          <span className="font-semibold">{language === 'hi' ? 'भाषा चुनें' : 'Select Language'}</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-ink-950 p-1 rounded-xl border border-ink-800">
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              language === 'en'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Switch to English"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => handleSelect('hi')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              language === 'hi'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Switch to Hindi"
          >
            हिंदी
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-ink-900/80 hover:bg-ink-800 text-slate-200 hover:text-white border border-ink-700/60 transition-all text-xs font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-teal-500/30"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Switch Language / भाषा बदलें"
      >
        <Globe className="w-3.5 h-3.5 text-teal-400" />
        <span className="hidden sm:inline-block font-medium">
          {language === 'hi' ? 'हिंदी' : 'English'}
        </span>
        <span className="sm:hidden font-medium">
          {language === 'hi' ? 'हि' : 'EN'}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-ink-950/95 backdrop-blur-md border border-ink-700/80 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-ink-800/80">
            {language === 'hi' ? 'भाषा' : 'Language'}
          </div>
          <button
            type="button"
            onClick={() => handleSelect('en')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
              language === 'en'
                ? 'text-teal-400 bg-ink-900/90 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-ink-900/60'
            }`}
          >
            <span>English</span>
            {language === 'en' && <Check className="w-3.5 h-3.5 text-teal-400" />}
          </button>
          <button
            type="button"
            onClick={() => handleSelect('hi')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors ${
              language === 'hi'
                ? 'text-teal-400 bg-ink-900/90 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-ink-900/60'
            }`}
          >
            <span>हिंदी</span>
            {language === 'hi' && <Check className="w-3.5 h-3.5 text-teal-400" />}
          </button>
        </div>
      )}
    </div>
  );
};
