import React from 'react';
import { BatchProgressInfo } from '../hooks/useBatchOCR';
import { Loader2, Layers, XCircle } from 'lucide-react';

interface BatchProgressProps {
  progress: BatchProgressInfo;
  onCancel?: () => void;
}

export const BatchProgress: React.FC<BatchProgressProps> = ({ progress, onCancel }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-brand-200 dark:border-brand-900/60 p-5 shadow-sm space-y-3 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Loader2 className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-spin flex-shrink-0" />
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">
                Processing {progress.currentIndex} of {progress.totalInBatch}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 font-medium">
                {progress.currentFilename}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {progress.currentStatusText || 'Recognizing text...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-base font-bold text-brand-600 dark:text-brand-400">
            {progress.overallPercentage}%
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex items-center gap-1"
              title="Stop remaining queue items"
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.max(3, progress.overallPercentage)}%` }}
          role="progressbar"
          aria-valuenow={progress.overallPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-brand-500" />
          Sequential local WebAssembly worker
        </span>
        <span>Reusing single OCR instance</span>
      </div>
    </div>
  );
};
