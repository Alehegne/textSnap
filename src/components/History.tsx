import React, { useEffect } from 'react';
import {
  X,
  Trash2,
  ExternalLink,
  Clock,
  FileText,
} from 'lucide-react';
import { HistoryItem } from '../types';
import { formatFileSize } from '../services/imageService';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearAll,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Modal Dialog Card */}
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 id="history-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Extractions
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear your entire extraction history?')) {
                    onClearAll();
                  }
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-medium px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-500 dark:text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-700 dark:text-slate-300">No extractions saved yet</p>
              <p className="text-xs">
                When you extract text from an image, it is securely saved in your browser's local
                storage for quick reference.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {item.fileName}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}{' '}
                      • {formatFileSize(item.fileSize)} • {item.wordCount} words
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onSelectHistoryItem(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 hover:bg-brand-100 transition-colors"
                      title="Load into editor"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Text Preview Snippet */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 font-mono bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700/50">
                  {item.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Stored privately in browser LocalStorage. Images are never stored.</span>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-700 dark:text-slate-200 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
