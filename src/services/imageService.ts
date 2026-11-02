import { ImagePreprocessingOptions } from '../types';

export const DEFAULT_PREPROCESSING: ImagePreprocessingOptions = {
  enabled: false,
  grayscale: true,
  contrast: 20,
  brightness: 0,
  binarize: false,
  binarizeThreshold: 128,
  invert: false,
};

/**
 * Format bytes to readable string (e.g., 2.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate word and character count
 */
export function calculateTextStats(text: string): { wordCount: number; charCount: number; linesCount: number } {
  const trimmed = text.trim();
  const charCount = text.length;
  const wordCount = trimmed === '' ? 0 : trimmed.split(/\s+/).filter(Boolean).length;
  const linesCount = trimmed === '' ? 0 : text.split(/\r\n|\r|\n/).length;

  return { wordCount, charCount, linesCount };
}

/**
 * Load an image from an object URL or Data URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for processing: ' + e));
    img.src = src;
  });
}

/**
 * Apply canvas-based preprocessing filters
 */
export async function preprocessImage(
  imageSrc: string,
  options: ImagePreprocessingOptions
): Promise<string> {
  if (!options.enabled) {
    return imageSrc;
  }

  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Draw original image
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Contrast calculation factor
  const contrastFactor =
    options.contrast !== 0
      ? (259 * (options.contrast + 255)) / (255 * (259 - options.contrast))
      : 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Grayscale conversion
    if (options.grayscale || options.binarize) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // Brightness
    if (options.brightness !== 0) {
      r = Math.min(255, Math.max(0, r + options.brightness));
      g = Math.min(255, Math.max(0, g + options.brightness));
      b = Math.min(255, Math.max(0, b + options.brightness));
    }

    // Contrast
    if (options.contrast !== 0) {
      r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
      g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
      b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));
    }

    // Optional Binarization (Thresholding)
    if (options.binarize) {
      const v = (r + g + b) / 3 >= options.binarizeThreshold ? 255 : 0;
      r = v;
      g = v;
      b = v;
    }

    // Optional Invert
    if (options.invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL('image/png');
}
