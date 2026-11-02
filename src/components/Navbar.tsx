import React from 'react';
import { ScanText, Github, ShieldCheck, History as HistoryIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHistory, historyCount = 0 }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-500/20">
            <ScanText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                Text<span className="text-brand-600 dark:text-brand-400">Snap</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <ShieldCheck className="w-3 h-3" />
                100% Client-Side
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
              Private In-Browser OCR
            </p>
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              title="View saved extractions"
            >
              <HistoryIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">History</span>
              {historyCount > 0 && (
                <span className="inline-flex items-center justify-center text-xs font-semibold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* GitHub Link */}
          <a
            href="https://github.com/alexoo/textSnap"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            aria-label="GitHub Repository"
            title="GitHub Repository"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};
