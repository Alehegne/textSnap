import React, { useState, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { BatchUpload } from './components/BatchUpload';
import { QueueItemCard } from './components/QueueItemCard';
import { BatchProgress } from './components/BatchProgress';
import { IndividualResult } from './components/IndividualResult';
import { CombinedResults } from './components/CombinedResults';
import { HistoryModal } from './components/History';
import { ImageEditorModal } from './components/ImageEditorModal';
import { Toast } from './components/Toast';
import { useImageQueue } from './hooks/useImageQueue';
import { useBatchOCR } from './hooks/useBatchOCR';
import { useClipboardImage } from './hooks/useClipboardImage';
import { useHistory } from './hooks/useHistory';
import { ToastMessage, QueueItem, HistoryItem, ImageEditorConfig } from './types';
import {
  Zap,
  Lock,
  Download,
  Cpu,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  Clock,
  AlertCircle,
  Crop,
} from 'lucide-react';
import { preprocessImage, DEFAULT_PREPROCESSING } from './services/imageService';
import { ImagePreprocessingOptions } from './types';

export const App: React.FC = () => {
  const {
    queue,
    activeItemId,
    activeItem,
    setActiveItemId,
    addFiles,
    removeQueueItem,
    clearQueue,
    updateItem,
    updateItemText,
    updateEditedItem,
    completedItems,
    failedItems,
    queuedItems,
  } = useImageQueue();

  const { history, addHistoryItem, removeHistoryItem, clearAllHistory } = useHistory();

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [viewTab, setViewTab] = useState<'individual' | 'combined'>('individual');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null);

  // Preprocessing state for active image
  const [preprocessing, setPreprocessing] =
    useState<ImagePreprocessingOptions>(DEFAULT_PREPROCESSING);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const showToast = useCallback(
    (type: ToastMessage['type'], message: string) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const result = addFiles(files);
      if (result.errors.length > 0) {
        showToast('error', result.errors[0]);
      } else if (result.addedCount > 0) {
        showToast(
          'success',
          `Added ${result.addedCount} image${result.addedCount > 1 ? 's' : ''} to queue.`
        );
      }
    },
    [addFiles, showToast]
  );

  // Native Clipboard Listener & Button integration
  const { pasteFromClipboard } = useClipboardImage({
    onImagesReceived: handleFilesAdded,
    onNotify: showToast,
  });

  // Batch OCR processing hook
  const { isProcessingBatch, batchProgress, processAll, processSingleItem, cancelBatch } =
    useBatchOCR({
      queue,
      updateItem,
      onItemCompleted: (item: QueueItem) => {
        if (item.extractedText && item.extractedText.trim().length > 0) {
          addHistoryItem({
            fileName: item.filename,
            fileSize: item.fileSize,
            text: item.extractedText,
            wordCount: item.wordCount,
            charCount: item.charCount,
            confidence: item.confidence,
          });
        }
      },
    });

  // Process a single item with optional preprocessing
  const handleProcessSingleItem = async (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;

    if (preprocessing.enabled) {
      try {
        const processedDataUrl = await preprocessImage(item.previewUrl, preprocessing);
        // Fetch data URL to Blob
        const res = await fetch(processedDataUrl);
        const blob = await res.blob();
        const enhancedFile = new File([blob], item.filename, { type: 'image/png' });

        updateItem(id, { file: enhancedFile });
      } catch (err) {
        console.warn('Preprocessing failed, continuing with original:', err);
      }
    }

    await processSingleItem(id);
  };

  // Handle saving edits from ImageEditorModal
  const handleApplyEditorChanges = async (
    targetItem: QueueItem,
    editedFile: File,
    editedPreviewUrl: string,
    config: ImageEditorConfig,
    shouldExtract: boolean
  ) => {
    updateEditedItem(targetItem.id, editedFile, editedPreviewUrl, config);
    showToast('success', `Applied transformations to "${targetItem.filename}".`);

    if (shouldExtract) {
      await processSingleItem(targetItem.id);
    }
  };

  // Restore history record into queue
  const handleSelectHistoryItem = (histItem: HistoryItem) => {
    // Generate placeholder image blob for restored text
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#64748B';
      ctx.font = '14px sans-serif';
      ctx.fillText('Restored Record', 20, 100);
    }
    canvas.toBlob((blob) => {
      const file = new File([blob || new Blob()], histItem.fileName, { type: 'image/png' });
      addFiles([file]);
      setTimeout(() => {
        if (activeItemId) {
          updateItem(activeItemId, {
            status: 'completed',
            extractedText: histItem.text,
            confidence: histItem.confidence,
            wordCount: histItem.wordCount,
            charCount: histItem.charCount,
            linesCount: histItem.text.split('\n').length,
            progress: 1,
          });
        }
      }, 50);
    });

    setIsHistoryOpen(false);
    showToast('info', `Restored "${histItem.fileName}" from history.`);
  };

  // Find index for navigator
  const completedIndex = activeItem
    ? completedItems.findIndex((i) => i.id === activeItem.id)
    : -1;

  const handleSelectPrevious = () => {
    if (completedIndex > 0) {
      setActiveItemId(completedItems[completedIndex - 1].id);
    }
  };

  const handleSelectNext = () => {
    if (completedIndex >= 0 && completedIndex < completedItems.length - 1) {
      setActiveItemId(completedItems[completedIndex + 1].id);
    }
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
        {/* Header Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Fast Batch OCR & Screenshot Pasting
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Extract text from <span className="text-brand-600 dark:text-brand-400">any image.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Drag and drop multiple documents, paste screenshots with{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Ctrl+V
            </kbd>
            , and extract text sequentially right in your browser with 100% privacy.
          </p>
        </div>

        {/* Central Workspace */}
        <div className="w-full space-y-6">
          {/* Batch Upload Section */}
          <BatchUpload
            onFilesAdded={handleFilesAdded}
            onPasteClick={pasteFromClipboard}
            onProcessAll={processAll}
            onClearQueue={clearQueue}
            queueCount={queue.length}
            queuedCount={queuedItems.length + failedItems.length}
            completedCount={completedItems.length}
            isProcessing={isProcessingBatch}
          />

          {/* Batch Processing Progress Bar */}
          {batchProgress && (
            <BatchProgress progress={batchProgress} onCancel={cancelBatch} />
          )}

          {/* Queue Items List (shown when queue has images) */}
          {queue.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <span>Image Queue</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    {queue.length} {queue.length === 1 ? 'file' : 'files'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-normal text-slate-500 dark:text-slate-400">
                  {completedItems.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {completedItems.length} done
                    </span>
                  )}
                  {queuedItems.length > 0 && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {queuedItems.length} queued
                    </span>
                  )}
                  {failedItems.length > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {failedItems.length} failed
                    </span>
                  )}
                </div>
              </div>

              {/* Grid of queue cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto p-0.5">
                {queue.map((item) => (
                  <QueueItemCard
                    key={item.id}
                    item={item}
                    isActive={activeItemId === item.id}
                    onSelect={() => setActiveItemId(item.id)}
                    onRemove={() => removeQueueItem(item.id)}
                    onRetry={() => handleProcessSingleItem(item.id)}
                    onEdit={() => setEditingItem(item)}
                    disabled={isProcessingBatch}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Item Preview & Preprocessing Toolbar (when selected item is still queued) */}
          {activeItem && activeItem.status === 'queued' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <img
                      src={activeItem.previewUrl}
                      alt={activeItem.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                      {activeItem.filename}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ready for OCR • Ready to process
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(activeItem)}
                    disabled={isProcessingBatch}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    title="Open Image Editor to crop, rotate, or adjust filters"
                  >
                    <Crop className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span>Edit Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      showFilters || preprocessing.enabled
                        ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Enhance Filters</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProcessSingleItem(activeItem.id)}
                    disabled={isProcessingBatch}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <span>Extract This Image</span>
                  </button>
                </div>
              </div>

              {/* Preprocessing Options */}
              {showFilters && (
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={preprocessing.enabled}
                      onChange={(e) =>
                        setPreprocessing((prev) => ({ ...prev, enabled: e.target.checked }))
                      }
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                    />
                    Enable Grayscale & Contrast Boost for OCR
                  </label>

                  {preprocessing.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={preprocessing.grayscale}
                          onChange={(e) =>
                            setPreprocessing((prev) => ({ ...prev, grayscale: e.target.checked }))
                          }
                          className="w-4 h-4 text-brand-600 rounded"
                        />
                        <span>Grayscale</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={preprocessing.binarize}
                          onChange={(e) =>
                            setPreprocessing((prev) => ({ ...prev, binarize: e.target.checked }))
                          }
                          className="w-4 h-4 text-brand-600 rounded"
                        />
                        <span>High-Contrast B&W</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={preprocessing.invert}
                          onChange={(e) =>
                            setPreprocessing((prev) => ({ ...prev, invert: e.target.checked }))
                          }
                          className="w-4 h-4 text-brand-600 rounded"
                        />
                        <span>Invert Colors</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Results Views (Individual vs Combined) */}
          {completedItems.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              {/* Tab Selector when multiple items are completed */}
              {completedItems.length > 1 && (
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewTab('individual')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        viewTab === 'individual'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Individual Result</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewTab('combined')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        viewTab === 'combined'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Combine All Results ({completedItems.length})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* View Content */}
              {viewTab === 'individual' || completedItems.length <= 1 ? (
                activeItem && activeItem.status === 'completed' ? (
                  <IndividualResult
                    item={activeItem}
                    onTextChange={(newText) => updateItemText(activeItem.id, newText)}
                    onRetry={() => handleProcessSingleItem(activeItem.id)}
                    onEdit={() => setEditingItem(activeItem)}
                    onSelectPrevious={handleSelectPrevious}
                    onSelectNext={handleSelectNext}
                    hasPrevious={completedIndex > 0}
                    hasNext={completedIndex < completedItems.length - 1}
                    currentIndex={completedIndex + 1}
                    totalCompleted={completedItems.length}
                    isProcessing={isProcessingBatch}
                  />
                ) : (
                  /* Fallback to first completed item if active item is not completed */
                  completedItems[0] && (
                    <IndividualResult
                      item={completedItems[0]}
                      onTextChange={(newText) => updateItemText(completedItems[0].id, newText)}
                      onRetry={() => handleProcessSingleItem(completedItems[0].id)}
                      onEdit={() => setEditingItem(completedItems[0])}
                      currentIndex={1}
                      totalCompleted={completedItems.length}
                      isProcessing={isProcessingBatch}
                    />
                  )
                )
              ) : (
                <CombinedResults completedItems={completedItems} />
              )}
            </div>
          )}

          {/* Idle Empty State Highlight Cards */}
          {queue.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
                  100% Private & Local
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Images never touch a backend server or database. All processing runs on your
                  browser's WebAssembly thread.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
                  Multi-Image Queue
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Upload dozens of photos, receipts, and screenshots. Process sequentially with a
                  single shared Tesseract worker.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base mb-1">
                  Combine & Export
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Combine all extractions into a single structured document or export individual
                  clean TXT files with preserved line breaks.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* History Drawer Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteHistoryItem={removeHistoryItem}
        onClearAll={clearAllHistory}
      />

      {/* Image Editor Modal */}
      <ImageEditorModal
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onApplyChanges={handleApplyEditorChanges}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 py-8 px-4 sm:px-6 lg:px-8 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">TextSnap V1.1</span>
            <span>•</span>
            <span>Local Batch OCR & Clipboard Screenshots</span>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p>
              Zero server uploads. Tesseract WASM engine and language data are cached via CDN.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Open source & client-side only. Designed for privacy, reliability, and speed.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
