import React, { useState, useCallback, useEffect } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { QueueItem, ImageEditorConfig, DEFAULT_EDITOR_CONFIG } from '../types';
import {
  processEditedImage,
  getImageDimensions,
} from '../services/imageProcessingService';
import {
  X,
  RotateCcw,
  RotateCw,
  Sun,
  Contrast,
  Crop as CropIcon,
  Check,
  Zap,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface ImageEditorModalProps {
  item: QueueItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyChanges: (
    item: QueueItem,
    editedFile: File,
    editedPreviewUrl: string,
    config: ImageEditorConfig,
    shouldExtract: boolean
  ) => Promise<void>;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  item,
  isOpen,
  onClose,
  onApplyChanges,
}) => {
  // Config state
  const [config, setConfig] = useState<ImageEditorConfig>(() => {
    return item?.editorConfig ? { ...item.editorConfig } : { ...DEFAULT_EDITOR_CONFIG };
  });

  const [crop, setCrop] = useState<Point>(() => item?.editorConfig?.crop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(() => item?.editorConfig?.zoom || 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
    () => item?.editorConfig?.cropAreaPixels || null
  );

  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever opened with a different item
  useEffect(() => {
    if (item && isOpen) {
      const initialConfig = item.editorConfig
        ? { ...item.editorConfig }
        : { ...DEFAULT_EDITOR_CONFIG };

      setConfig(initialConfig);
      setCrop(initialConfig.crop);
      setZoom(initialConfig.zoom);
      setCroppedAreaPixels(initialConfig.cropAreaPixels);
      setError(null);

      const sourceToLoad = item.originalPreviewUrl || item.previewUrl;

      // Fetch natural dimensions
      getImageDimensions(sourceToLoad)
        .then((dims) => setOriginalDimensions(dims))
        .catch(() => setOriginalDimensions(null));
    }
  }, [item, isOpen]);

  // Handle ESC key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isExporting]);

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  // Rotation controls
  const handleRotateLeft = () => {
    setConfig((prev) => {
      const nextRotation = (prev.rotation - 90 + 360) % 360;
      return { ...prev, rotation: nextRotation };
    });
  };

  const handleRotateRight = () => {
    setConfig((prev) => {
      const nextRotation = (prev.rotation + 90) % 360;
      return { ...prev, rotation: nextRotation };
    });
  };

  // Reset to default
  const handleResetAll = () => {
    setConfig({ ...DEFAULT_EDITOR_CONFIG });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  // Calculate current output dimensions
  const getOutputDimensions = (): { width: number; height: number } | null => {
    if (!originalDimensions) return null;
    const isRotated90 = Math.abs(config.rotation % 180) === 90;
    const rotatedWidth = isRotated90 ? originalDimensions.height : originalDimensions.width;
    const rotatedHeight = isRotated90 ? originalDimensions.width : originalDimensions.height;

    if (croppedAreaPixels && croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0) {
      return {
        width: Math.round(croppedAreaPixels.width),
        height: Math.round(croppedAreaPixels.height),
      };
    }

    return { width: rotatedWidth, height: rotatedHeight };
  };

  const outputDims = getOutputDimensions();

  // Apply changes via Canvas pipeline
  const handleSave = async (shouldExtract: boolean) => {
    if (!item) return;

    setIsExporting(true);
    setError(null);

    const finalConfig: ImageEditorConfig = {
      ...config,
      crop,
      zoom,
      cropAreaPixels: croppedAreaPixels,
    };

    try {
      const sourceToProcess = item.originalPreviewUrl || item.previewUrl;
      const fileType = (item.originalFile?.type) || item.file.type || 'image/png';

      const result = await processEditedImage(
        sourceToProcess,
        finalConfig,
        item.filename,
        fileType
      );

      await onApplyChanges(item, result.file, result.previewUrl, finalConfig, shouldExtract);
      setIsExporting(false);
      onClose();
    } catch (err) {
      console.error('Image export failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to apply image edits. Please try again.'
      );
      setIsExporting(false);
    }
  };

  if (!isOpen || !item) return null;

  // Real-time CSS filter for 60fps slider updates
  const previewFilterStyle = `brightness(${config.brightness}%) contrast(${config.contrast}%) grayscale(${config.grayscale ? 100 : 0}%)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in">
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-editor-title"
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <CropIcon className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
            <div className="truncate">
              <h2 id="image-editor-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Edit Image: {item.filename}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {originalDimensions && (
                  <span>
                    Original: {originalDimensions.width} × {originalDimensions.height} px
                  </span>
                )}
                {outputDims && (
                  <>
                    <span>•</span>
                    <span className="text-brand-600 dark:text-brand-400 font-medium">
                      Output: {outputDims.width} × {outputDims.height} px
                    </span>
                  </>
                )}
                {config.rotation !== 0 && (
                  <>
                    <span>•</span>
                    <span>{config.rotation}°</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAll}
              disabled={isExporting}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Reset all edits to original"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close image editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-5 py-2.5 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Viewport Workspace */}
        <div className="relative flex-1 min-h-[320px] max-h-[500px] bg-slate-950 flex items-center justify-center overflow-hidden">
          <Cropper
            image={item.originalPreviewUrl || item.previewUrl}
            crop={crop}
            zoom={zoom}
            rotation={config.rotation}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { backgroundColor: '#090D16' },
              mediaStyle: {
                filter: previewFilterStyle,
                transition: 'filter 0.05s ease-out',
              },
            }}
          />

          {/* Quick Indicator Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-medium pointer-events-none select-none">
            <Eye className="w-3 h-3 text-brand-400" />
            <span>Interactive Crop & 60fps Live Preview</span>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rotation Controls */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                <span>Orientation</span>
                <span className="font-mono text-[11px] text-slate-500">{config.rotation}°</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotateLeft}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                  title="Rotate 90 degrees counterclockwise"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Left 90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleRotateRight}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                  title="Rotate 90 degrees clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Right 90°</span>
                </button>
              </div>
            </div>

            {/* Brightness Slider */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Brightness</span>
                </span>
                <span className="font-mono text-[11px] text-brand-600 dark:text-brand-400">
                  {config.brightness}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={config.brightness}
                onChange={(e) => setConfig((prev) => ({ ...prev, brightness: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0%</span>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, brightness: 100 }))}
                  className="hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Reset (100%)
                </button>
                <span>200%</span>
              </div>
            </div>

            {/* Contrast Slider */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1">
                  <Contrast className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Contrast</span>
                </span>
                <span className="font-mono text-[11px] text-brand-600 dark:text-brand-400">
                  {config.contrast}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={config.contrast}
                onChange={(e) => setConfig((prev) => ({ ...prev, contrast: Number(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0%</span>
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, contrast: 100 }))}
                  className="hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Reset (100%)
                </button>
                <span>200%</span>
              </div>
            </div>

            {/* Grayscale Toggle */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color Mode
              </span>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Grayscale (B&W)
                </span>
                <input
                  type="checkbox"
                  checked={config.grayscale}
                  onChange={(e) => setConfig((prev) => ({ ...prev, grayscale: e.target.checked }))}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
              </label>
              <span className="text-[10px] text-slate-400 mt-1">
                {config.grayscale ? 'Grayscale filter enabled' : 'Full original color'}
              </span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors disabled:opacity-40"
                title="Save changes to image in queue without extracting immediately"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Apply Changes</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Apply all edits and run OCR extraction immediately"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Canvas...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Apply & Extract Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
