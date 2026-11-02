import React from 'react';
import { QueueItem } from '../types';
import { formatFileSize } from '../services/imageService';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  X,
  RotateCcw,
} from 'lucide-react';

interface QueueItemCardProps {
  item: QueueItem;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRetry: () => void;
  disabled?: boolean;
}

export const QueueItemCard: React.FC<QueueItemCardProps> = ({
  item,
  isActive,
  onSelect,
  onRemove,
  onRetry,
  disabled = false,
}) => {
  const isQueued = item.status === 'queued';
  const isProcessing = item.status === 'processing';
  const isCompleted = item.status === 'completed';
  const isFailed = item.status === 'failed';

  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-xl p-3 border transition-all cursor-pointer flex items-center gap-3 ${
        isActive
          ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 shadow-xs ring-1 ring-brand-400/50'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-850'
      }`}
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center">
        <img
          src={item.previewUrl}
          alt={item.filename}
          className="w-full h-full object-cover select-none"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`font-medium text-xs sm:text-sm truncate ${
              isActive
                ? 'text-brand-900 dark:text-brand-100 font-semibold'
                : 'text-slate-800 dark:text-slate-200'
            }`}
            title={item.filename}
          >
            {item.filename}
          </p>

          {/* Status Badge */}
          {isQueued && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
              <Clock className="w-3 h-3 text-slate-400" />
              Queued
            </span>
          )}

          {isProcessing && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 flex-shrink-0">
              <Loader2 className="w-3 h-3 animate-spin text-brand-600 dark:text-brand-400" />
              {Math.round(item.progress * 100)}%
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex-shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              {item.confidence > 0 ? `${item.confidence}%` : 'Done'}
            </span>
          )}

          {isFailed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 flex-shrink-0">
              <AlertCircle className="w-3 h-3 text-red-500" />
              Failed
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          <span>{formatFileSize(item.fileSize)}</span>
          {isCompleted && (
            <span>
              {item.wordCount} words • {item.charCount} chars
            </span>
          )}
          {isProcessing && (
            <span className="truncate max-w-[140px] text-brand-600 dark:text-brand-400">
              {item.progressStatus || 'Analyzing...'}
            </span>
          )}
          {isFailed && item.error && (
            <span className="text-red-500 truncate max-w-[140px]">{item.error}</span>
          )}
        </div>

        {/* Mini progress bar if processing */}
        {isProcessing && (
          <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-200"
              style={{ width: `${Math.max(5, item.progress * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1">
        {isFailed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            disabled={disabled}
            className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
            title="Retry this image"
            aria-label="Retry this image"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={disabled && isProcessing}
          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title="Remove from queue"
          aria-label={`Remove ${item.filename}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
