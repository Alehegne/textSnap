import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QueueItem } from '../types';
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  Layers,
  FileText,
  Type,
  AlignLeft,
} from 'lucide-react';
import { calculateTextStats } from '../services/imageService';

interface CombinedResultsProps {
  completedItems: QueueItem[];
}

export function formatCombinedResults(items: QueueItem[]): string {
  const completed = items.filter(
    (item) => item.status === 'completed' && item.extractedText.trim().length > 0
  );

  return completed
    .map((item) => `--- ${item.filename} ---\n\n${item.extractedText.trim()}`)
    .join('\n\n\n');
}

export const CombinedResults: React.FC<CombinedResultsProps> = ({ completedItems }) => {
  const [combinedText, setCombinedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [hasManuallyEdited, setHasManuallyEdited] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-generate combined text initially or when new items complete,
  // provided the user hasn't started manually typing in the combined box
  useEffect(() => {
    if (!hasManuallyEdited) {
      const generated = formatCombinedResults(completedItems);
      setCombinedText(generated);
    }
  }, [completedItems, hasManuallyEdited]);

  const handleManualRecombine = () => {
    const generated = formatCombinedResults(completedItems);
    setCombinedText(generated);
    setHasManuallyEdited(false);
  };

  const handleCopy = useCallback(async () => {
    if (!combinedText) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(combinedText);
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
  }, [combinedText]);

  const handleDownload = useCallback(() => {
    if (!combinedText) return;

    try {
      const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `textsnap-combined-${completedItems.length}-documents.txt`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error('Failed to download combined file:', err);
    }
  }, [combinedText, completedItems.length]);

  const stats = calculateTextStats(combinedText);
  const eligibleCount = completedItems.filter(
    (i) => i.status === 'completed' && i.extractedText.trim().length > 0
  ).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Header Bar */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-100 font-semibold text-sm sm:text-base">
            <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Combined Extractions</span>
          </div>

          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50">
            {eligibleCount} {eligibleCount === 1 ? 'image' : 'images'} included
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {hasManuallyEdited && (
            <button
              type="button"
              onClick={handleManualRecombine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Reset combined text from original image results"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-combine</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            disabled={!combinedText}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Copy combined text"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Copy Combined</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!combinedText}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Download combined text file"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Download Combined TXT</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-4 sm:p-6 flex-1 min-h-[300px] flex flex-col">
        {!combinedText ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-2">
            <FileText className="w-10 h-10 stroke-[1.5]" />
            <p className="font-medium text-slate-700 dark:text-slate-300">No completed extractions yet</p>
            <p className="text-xs max-w-sm">
              As images in the queue finish processing, their recognized text will be automatically
              formatted and compiled here.
            </p>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={combinedText}
            onChange={(e) => {
              setCombinedText(e.target.value);
              setHasManuallyEdited(true);
            }}
            className="w-full flex-1 min-h-[280px] p-4 text-sm sm:text-base font-mono text-slate-800 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-y leading-relaxed"
            placeholder="Combined extractions will appear here..."
            spellCheck="true"
            aria-label="Editable combined extracted text"
          />
        )}
      </div>

      {/* Metrics Footer */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5" />
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {stats.charCount.toLocaleString()}
            </strong>{' '}
            characters
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <AlignLeft className="w-3.5 h-3.5" />
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {stats.wordCount.toLocaleString()}
            </strong>{' '}
            words
          </span>
          <span>•</span>
          <span>
            <strong className="font-semibold text-slate-700 dark:text-slate-300">
              {stats.linesCount.toLocaleString()}
            </strong>{' '}
            lines
          </span>
        </div>

        <span className="italic text-[11px] text-slate-400 dark:text-slate-500">
          Combined in original queue order • Preserves individual document headers
        </span>
      </div>
    </div>
  );
};
