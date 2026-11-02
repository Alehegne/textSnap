import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Image as ImageIcon, AlertCircle, FileText, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  error: string | null;
  onErrorDismiss?: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFileSelect,
  error,
  onErrorDismiss,
  disabled = false,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  // Helper to load a sample demo image directly via Canvas
  const loadDemoSample = (textType: 'receipt' | 'quote') => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill crisp white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (textType === 'quote') {
      ctx.fillStyle = '#1E293B';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('INVOICE / RECEIPT SUMMARY', 60, 70);

      ctx.fillStyle = '#475569';
      ctx.font = '18px monospace';
      ctx.fillText('Invoice #: INV-2026-0842', 60, 120);
      ctx.fillText('Date: November 2, 2026', 60, 150);
      ctx.fillText('Client: Acme Corporation', 60, 180);
      ctx.fillText('------------------------------------------------', 60, 210);
      ctx.fillText('Item: Cloud Services Annual Plan     $1,200.00', 60, 240);
      ctx.fillText('Item: Premium Technical Support       $350.00', 60, 270);
      ctx.fillText('Tax (8%):                             $124.00', 60, 300);
      ctx.font = 'bold 20px monospace';
      ctx.fillText('TOTAL DUE:                           $1,674.00', 60, 340);
    } else {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'italic bold 28px serif';
      ctx.fillText('"The only way to do great work is to love', 80, 120);
      ctx.fillText('what you do. If you haven\'t found it yet,', 80, 170);
      ctx.fillText('keep looking. Don\'t settle."', 80, 220);

      ctx.fillStyle = '#334155';
      ctx.font = 'normal 20px sans-serif';
      ctx.fillText('— Steve Jobs, Stanford Commencement Address', 80, 280);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('Optical Character Recognition Benchmark Text', 80, 330);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File(
          [blob],
          textType === 'quote' ? 'sample-invoice.png' : 'sample-quote.png',
          { type: 'image/png' }
        );
        onFileSelect(file);
      }
    }, 'image/png');
  };

  return (
    <div className="w-full">
      {/* Drop Area */}
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
          isDragActive
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/20 scale-[0.99]'
            : isDragReject
            ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-brand-400 dark:hover:border-brand-500/80 hover:bg-slate-50/60 dark:hover:bg-slate-900 shadow-sm'
        } ${disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
        tabIndex={0}
        role="button"
        aria-label="Upload image for OCR"
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-transform ${
            isDragActive
              ? 'scale-110 bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:scale-105'
          }`}
        >
          {isDragActive ? (
            <UploadCloud className="w-8 h-8 animate-bounce text-brand-600 dark:text-brand-400" />
          ) : (
            <ImageIcon className="w-8 h-8" />
          )}
        </div>

        {/* Text */}
        <div className="text-center max-w-md">
          <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
            {isDragActive ? (
              <span className="text-brand-600 dark:text-brand-400">Drop the image here</span>
            ) : (
              <span>
                Drag & drop your image here, or{' '}
                <span className="text-brand-600 dark:text-brand-400 underline underline-offset-2">
                  browse files
                </span>
              </span>
            )}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Supports <span className="font-medium text-slate-700 dark:text-slate-300">JPG, PNG, WebP</span> up to{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">8 MB</span>.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-center gap-1">
            Processed 100% locally on your machine. Never uploaded.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start justify-between gap-3 text-sm animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
          {onErrorDismiss && (
            <button
              type="button"
              onClick={onErrorDismiss}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Or try a sample:
        </span>
        <button
          type="button"
          onClick={() => loadDemoSample('quote')}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-600 transition-colors shadow-2xs disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5 text-brand-500" />
          Sample Invoice
        </button>
        <button
          type="button"
          onClick={() => loadDemoSample('receipt')}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-600 transition-colors shadow-2xs disabled:opacity-50"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          Sample Quote
        </button>
      </div>
    </div>
  );
};
