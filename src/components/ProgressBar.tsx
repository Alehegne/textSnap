import React from 'react';
import { OCRProgress } from '../types';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: OCRProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const percentage = Math.round((progress.progress || 0) * 100);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin flex-shrink-0" />
          <span className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
            {progress.status || 'Processing image...'}
          </span>
        </div>
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex-shrink-0">
          {percentage}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(4, percentage)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Tesseract.js WASM Engine</span>
        <span>Extracting English Text</span>
      </div>
    </div>
  );
};
