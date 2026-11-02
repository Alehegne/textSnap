import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { ProgressBar } from './components/ProgressBar';
import { OCRResults } from './components/OCRResults';
import { HistoryModal } from './components/History';
import { useImageUpload } from './hooks/useImageUpload';
import { useOCR } from './hooks/useOCR';
import { useHistory } from './hooks/useHistory';
import {
  Zap,
  Lock,
  Download,
  AlertCircle,
  Cpu,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    image,
    processedPreviewUrl,
    preprocessing,
    error: uploadError,
    isPreprocessing,
    handleFileSelect,
    clearImage,
    updatePreprocessing,
    resetPreprocessing,
    setError: setUploadError,
  } = useImageUpload();

  const {
    status: ocrStatus,
    progress: ocrProgress,
    result: ocrResult,
    error: ocrError,
    processImage,
    setText,
    resetOCR,
  } = useOCR();

  const {
    history,
    addHistoryItem,
    removeHistoryItem,
    clearAllHistory,
  } = useHistory();

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [restoredFileName, setRestoredFileName] = useState<string>('');

  const isExtracting = ocrStatus === 'loading' || ocrStatus === 'processing';

  // Handle OCR Extraction Trigger
  const handleExtract = async () => {
    if (!image) return;

    // Use preprocessed image if enabled, otherwise raw object URL
    const sourceToUse =
      preprocessing.enabled && processedPreviewUrl
        ? processedPreviewUrl
        : image.previewUrl;

    const res = await processImage(sourceToUse);
    if (res && res.text) {
      addHistoryItem({
        fileName: image.name,
        fileSize: image.size,
        text: res.text,
        wordCount: res.wordCount,
        charCount: res.charCount,
        confidence: res.confidence,
      });
    }
  };

  // Full reset (start again)
  const handleStartAgain = () => {
    clearImage();
    resetOCR();
    setRestoredFileName('');
  };

  // Restore history record
  const handleSelectHistoryItem = (item: (typeof history)[0]) => {
    clearImage();
    setText(item.text);
    setRestoredFileName(item.fileName);
    setIsHistoryOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors duration-200">
      {/* 1. Navbar */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center">
        {/* 2 & 3. Main Heading & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Fast Browser-Native OCR
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Extract text from <span className="text-brand-600 dark:text-brand-400">any image.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Drag and drop receipts, documents, screenshots, or quotes. All optical character
            recognition happens locally inside your browser with complete privacy.
          </p>
        </div>

        {/* Central Workspace Card Area */}
        <div className="w-full space-y-6">
          {/* Uploader (shown when no image is loaded and no result is showing) */}
          {!image && !ocrResult && (
            <ImageUploader
              onFileSelect={handleFileSelect}
              error={uploadError}
              onErrorDismiss={() => setUploadError(null)}
              disabled={isExtracting}
            />
          )}

          {/* Image Preview & Controls (shown when image is loaded and not finished with OCR) */}
          {image && !ocrResult && (
            <ImagePreview
              image={image}
              processedPreviewUrl={processedPreviewUrl}
              preprocessing={preprocessing}
              isPreprocessing={isPreprocessing}
              onUpdatePreprocessing={updatePreprocessing}
              onResetPreprocessing={resetPreprocessing}
              onRemove={clearImage}
              onExtract={handleExtract}
              isExtracting={isExtracting}
            />
          )}

          {/* 9. Processing Progress Indicator */}
          {isExtracting && (
            <div className="animate-fade-in">
              <ProgressBar progress={ocrProgress} />
            </div>
          )}

          {/* OCR Error Notification */}
          {ocrStatus === 'error' && ocrError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-semibold mb-1">OCR Processing Error</p>
                <p>{ocrError}</p>
                <button
                  type="button"
                  onClick={handleExtract}
                  className="mt-3 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Retry Extraction
                </button>
              </div>
            </div>
          )}

          {/* 10-14. Extracted Text Results & Editor */}
          {ocrResult && (
            <div className="animate-fade-in space-y-6">
              <OCRResults
                result={ocrResult}
                fileName={image ? image.name : restoredFileName || 'extracted-document'}
                onTextChange={setText}
                onReset={handleStartAgain}
                onRetry={handleExtract}
              />
            </div>
          )}

          {/* Value Props & Architecture Highlights (shown on idle screen) */}
          {!image && !ocrResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
                  100% Private & Local
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Images never touch a backend server or database. Processing executes on your CPU
                  via browser WebAssembly.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
                  Smart Image Filters
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enhance faint handwriting or noisy backgrounds with live grayscale, contrast
                  boosting, and binarization.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
                  Export & Edit
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Instantly edit recognized text, copy to your clipboard with one click, or save
                  clean formatted TXT documents.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 15. History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteHistoryItem={removeHistoryItem}
        onClearAll={clearAllHistory}
      />

      {/* 16. Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 py-8 px-4 sm:px-6 lg:px-8 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">TextSnap</span>
            <span>•</span>
            <span>Powered by Tesseract.js & WebAssembly</span>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p>
              Zero server uploads. Tesseract WASM engine and language data are cached via CDN.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Open source & client-side only. Designed for privacy and speed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
