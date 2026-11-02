import React, { useState, useRef, useCallback } from 'react';
import { QueueItem } from '../types';
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  AlertCircle,
  Gauge,
  Type,
  AlignLeft,
  ChevronLeft,
  ChevronRight,
  Crop,
} from 'lucide-react';

interface IndividualResultProps {
  item: QueueItem;
  onTextChange: (newText: string) => void;
  onRetry: () => void;
  onEdit?: () => void;
  onSelectPrevious?: () => void;
  onSelectNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCompleted?: number;
  isProcessing?: boolean;
}

export const IndividualResult: React.FC<IndividualResultProps> = ({
  item,
  onTextChange,
  onRetry,
  onEdit,
  onSelectPrevious,
  onSelectNext,
  hasPrevious = false,
  hasNext = false,
  currentIndex,
  totalCompleted,
  isProcessing = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = useCallback(async () => {
    if (!item.extractedText) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(item.extractedText);
      } else {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.select();
          document.execCommand('copy');
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }, [item.extractedText]);

  const handleDownload = useCallback(() => {
    if (!item.extractedText) return;

    try {
      const blob = new Blob([item.extractedText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const baseName = item.filename.replace(/\.[^/.]+$/, '');
      link.href = url;
      link.download = `${baseName || 'textsnap-extracted'}.txt`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  }, [item.extractedText, item.filename]);

  const isEmpty = !item.extractedText || item.extractedText.trim().length === 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Header Bar */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Thumbnail */}
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border border-slate-200 dark:border-slate-700">
            <img src={item.previewUrl} alt={item.filename} className="w-full h-full object-cover" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
                {item.filename}
              </h3>
              {item.confidence > 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    item.confidence >= 80
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                      : item.confidence >= 50
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                  }`}
                  title="Confidence rating"
                >
                  <Gauge className="w-3 h-3" />
                  {item.confidence}% confidence
                </span>
              )}
            </div>

            {typeof currentIndex === 'number' && typeof totalCompleted === 'number' && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Viewing document {currentIndex} of {totalCompleted}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Previous / Next Navigator */}
          {(onSelectPrevious || onSelectNext) && (
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={onSelectPrevious}
                disabled={!hasPrevious}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="View previous result"
                aria-label="Previous result"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onSelectNext}
                disabled={!hasNext}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors border-l border-slate-200 dark:border-slate-700"
                title="View next result"
                aria-label="Next result"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={isEmpty}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Copy extracted text to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isEmpty}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download text as .txt file"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Download .txt</span>
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Edit image (crop, rotate, adjust filters)"
            >
              <Crop className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Edit Image</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRetry}
            disabled={isProcessing}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            title="Re-run OCR for this image"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Retry</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative p-4 sm:p-6 flex-1 min-h-[260px] flex flex-col">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 dark:text-slate-400 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 stroke-[1.5]" />
            <div className="max-w-md">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-base mb-1">
                No Readable Text Detected
              </h4>
              <p className="text-sm">
                No characters could be recognized in this image. You can re-run OCR or edit this
                area manually.
              </p>
            </div>
            <button
              type="button"
              onClick={onRetry}
              disabled={isProcessing}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Recognition
            </button>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={item.extractedText}
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full flex-1 min-h-[240px] p-4 text-sm sm:text-base font-mono text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-y leading-relaxed transition-colors"
            placeholder="Extracted text will appear here. You can also edit it directly..."
            spellCheck="true"
            aria-label={`Extracted text for ${item.filename}`}
          />
        )}
      </div>

      {/* Footer Metrics */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {item.charCount.toLocaleString()}
            </strong>{' '}
            characters
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5" />
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {item.wordCount.toLocaleString()}
            </strong>{' '}
            words
          </span>
          <span>•</span>
          <span>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {item.linesCount.toLocaleString()}
            </strong>{' '}
            lines
          </span>
        </div>

        <span className="italic text-[11px] text-slate-400 dark:text-slate-500">
          Editable in-place • Preserves line breaks
        </span>
      </div>
    </div>
  );
};
