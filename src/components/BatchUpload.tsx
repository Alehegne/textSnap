import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  ImageIcon,
  ClipboardPaste,
  Sparkles,
  FileText,
  Play,
  Trash2,
  Plus,
} from 'lucide-react';

interface BatchUploadProps {
  onFilesAdded: (files: File[]) => void;
  onPasteClick: () => void;
  onProcessAll: () => void;
  onClearQueue: () => void;
  queueCount: number;
  queuedCount: number;
  completedCount: number;
  isProcessing: boolean;
  disabled?: boolean;
}

export const BatchUpload: React.FC<BatchUploadProps> = ({
  onFilesAdded,
  onPasteClick,
  onProcessAll,
  onClearQueue,
  queueCount,
  queuedCount,
  isProcessing,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    disabled: disabled || isProcessing,
  });

  // Generate programmatic demo sample
  const loadDemoSample = (textType: 'invoice' | 'quote') => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (textType === 'invoice') {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('SAMPLE COMMERCIAL INVOICE', 50, 60);

      ctx.fillStyle = '#334155';
      ctx.font = '16px monospace';
      ctx.fillText('Invoice #: INV-2026-9921', 50, 110);
      ctx.fillText('Issued: November 2, 2026', 50, 140);
      ctx.fillText('Billed To: Global Solutions Inc.', 50, 170);
      ctx.fillText('----------------------------------------------------', 50, 200);
      ctx.fillText('1x Frontend Engineering Retainer       $3,500.00', 50, 230);
      ctx.fillText('1x High-Performance OCR Integration   $1,200.00', 50, 260);
      ctx.fillText('VAT / Tax (10%):                         $470.00', 50, 290);
      ctx.font = 'bold 18px monospace';
      ctx.fillText('TOTAL BALANCE DUE:                     $5,170.00', 50, 335);
    } else {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'italic bold 26px serif';
      ctx.fillText('"Simplicity is prerequisite for reliability."', 60, 110);
      ctx.fillText('— Edsger W. Dijkstra', 60, 160);

      ctx.fillStyle = '#334155';
      ctx.font = '18px sans-serif';
      ctx.fillText('Computer Science Principles & Software Architecture', 60, 220);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Benchmark document for optical character recognition evaluation.', 60, 280);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob],
          textType === 'invoice' ? 'sample-invoice.png' : 'sample-quote.png',
          { type: 'image/png' }
        );
        onFilesAdded([file]);
      }
    }, 'image/png');
  };

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const pasteShortcut = isMac ? '⌘V' : 'Ctrl+V';

  return (
    <div className="w-full space-y-4">
      {/* Drop Area */}
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          isDragActive
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/20 scale-[0.99]'
            : isDragReject
            ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-brand-400 dark:hover:border-brand-500/80 hover:bg-slate-50/60 dark:hover:bg-slate-900 shadow-sm'
        } ${disabled || isProcessing ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
        tabIndex={0}
        role="button"
        aria-label="Upload multiple images for batch OCR"
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-2xl mb-3 transition-transform ${
            isDragActive
              ? 'scale-110 bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {isDragActive ? (
            <UploadCloud className="w-7 h-7 animate-bounce text-brand-600 dark:text-brand-400" />
          ) : (
            <ImageIcon className="w-7 h-7" />
          )}
        </div>

        {/* Text */}
        <div className="text-center max-w-md">
          <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
            {isDragActive ? (
              <span className="text-brand-600 dark:text-brand-400">Drop images here</span>
            ) : (
              <span>
                Drag & drop multiple images, or{' '}
                <span className="text-brand-600 dark:text-brand-400 underline underline-offset-2">
                  browse files
                </span>
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            JPG, PNG, WebP up to 8 MB each. Paste screenshots anytime with{' '}
            <kbd className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              {pasteShortcut}
            </kbd>
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Add More Images Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title="Browse and select additional images"
          >
            <Plus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Add Images</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFilesAdded(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
          />

          {/* Paste Image Button */}
          <button
            type="button"
            onClick={onPasteClick}
            disabled={disabled || isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title={`Paste image from clipboard (${pasteShortcut})`}
          >
            <ClipboardPaste className="w-4 h-4 text-indigo-500" />
            <span>Paste Image</span>
            <span className="hidden md:inline text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              ({pasteShortcut})
            </span>
          </button>

          {/* Try Demo Samples */}
          <button
            type="button"
            onClick={() => loadDemoSample('invoice')}
            disabled={disabled || isProcessing}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors disabled:opacity-50"
            title="Add sample invoice to queue"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Sample Invoice
          </button>
          <button
            type="button"
            onClick={() => loadDemoSample('quote')}
            disabled={disabled || isProcessing}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors disabled:opacity-50"
            title="Add sample quote to queue"
          >
            <FileText className="w-3.5 h-3.5 text-brand-500" />
            Sample Quote
          </button>
        </div>

        {/* Process All & Clear Queue */}
        <div className="flex items-center gap-2">
          {queueCount > 0 && (
            <button
              type="button"
              onClick={onClearQueue}
              disabled={isProcessing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
              title="Remove all images from queue"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          )}

          {queuedCount > 0 && (
            <button
              type="button"
              onClick={onProcessAll}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-sm shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Extract text sequentially from all queued images"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                Process All {queuedCount > 1 ? `(${queuedCount})` : ''}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
