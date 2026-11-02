import React, { useState } from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  Languages,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { UploadedImage, ImagePreprocessingOptions } from '../types';
import { formatFileSize } from '../services/imageService';

interface ImagePreviewProps {
  image: UploadedImage;
  processedPreviewUrl: string | null;
  preprocessing: ImagePreprocessingOptions;
  isPreprocessing: boolean;
  onUpdatePreprocessing: (updater: Partial<ImagePreprocessingOptions>) => void;
  onResetPreprocessing: () => void;
  onRemove: () => void;
  onExtract: () => void;
  isExtracting: boolean;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  processedPreviewUrl,
  preprocessing,
  isPreprocessing,
  onUpdatePreprocessing,
  onResetPreprocessing,
  onRemove,
  onExtract,
  isExtracting,
}) => {
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'original' | 'processed'>('processed');

  const activeDisplayUrl =
    preprocessing.enabled && processedPreviewUrl && viewMode === 'processed'
      ? processedPreviewUrl
      : image.previewUrl;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      {/* Top Header Bar */}
      <div className="px-4 py-3 sm:px-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="truncate">
            <h3 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 truncate">
              {image.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{formatFileSize(image.size)}</span>
              {image.width && image.height && (
                <>
                  <span>•</span>
                  <span>{image.width} × {image.height} px</span>
                </>
              )}
              <span>•</span>
              <span className="uppercase">{image.type.replace('image/', '')}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showFilters || preprocessing.enabled
                ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Image enhancements for better OCR"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Enhance</span>
            {preprocessing.enabled && (
              <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400" />
            )}
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={isExtracting}
            className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
            title="Remove image"
            aria-label="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preprocessing Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enable-enhancement"
                checked={preprocessing.enabled}
                onChange={(e) => onUpdatePreprocessing({ enabled: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <label
                htmlFor="enable-enhancement"
                className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Enable Image Enhancement Filters
              </label>
            </div>

            {preprocessing.enabled && (
              <button
                type="button"
                onClick={onResetPreprocessing}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {preprocessing.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              {/* Grayscale Toggle */}
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={preprocessing.grayscale}
                  onChange={(e) => onUpdatePreprocessing({ grayscale: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Grayscale</span>
              </label>

              {/* Binarization Toggle */}
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={preprocessing.binarize}
                  onChange={(e) => onUpdatePreprocessing({ binarize: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">High-Contrast B&W</span>
              </label>

              {/* Invert Colors */}
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={preprocessing.invert}
                  onChange={(e) => onUpdatePreprocessing({ invert: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Invert Colors</span>
              </label>

              {/* Contrast Slider */}
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Contrast</span>
                  <span>{preprocessing.contrast}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={preprocessing.contrast}
                  onChange={(e) => onUpdatePreprocessing({ contrast: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Preview Frame */}
      <div className="relative p-4 sm:p-6 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950/60 min-h-[260px] max-h-[460px] overflow-hidden">
        {isPreprocessing && (
          <div className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[1px] flex items-center justify-center text-white text-xs font-medium">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Applying filters...
          </div>
        )}

        {/* View toggle badge (Original vs Filtered) */}
        {preprocessing.enabled && processedPreviewUrl && (
          <div className="absolute top-3 left-3 z-10 flex rounded-lg p-0.5 bg-black/60 backdrop-blur-md text-white text-xs">
            <button
              type="button"
              onClick={() => setViewMode('processed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'processed' ? 'bg-brand-600 font-medium' : 'text-slate-300 hover:text-white'
              }`}
            >
              Filtered
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'original' ? 'bg-brand-600 font-medium' : 'text-slate-300 hover:text-white'
              }`}
            >
              Original
            </button>
          </div>
        )}

        <img
          src={activeDisplayUrl}
          alt={image.name}
          className="max-h-[380px] w-auto max-w-full object-contain rounded-lg shadow-sm select-none"
        />
      </div>

      {/* Action Footer */}
      <div className="px-4 py-3.5 sm:px-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Language Indicator */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <Languages className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Language:</span>
          <span className="font-semibold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            English (eng)
          </span>
        </div>

        {/* Extract Button */}
        <button
          type="button"
          onClick={onExtract}
          disabled={isExtracting}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm sm:text-base text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Recognizing Text...</span>
            </>
          ) : (
            <>
              <span>Extract Text</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
