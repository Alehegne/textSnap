import { ImageEditorConfig, CropAreaPixels } from '../types';

/**
 * Load an image element asynchronously from URL or Object URL
 */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for processing: ' + e));
    img.src = src;
  });
}

/**
 * Get natural dimensions of an image
 */
export async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  const img = await loadImageElement(src);
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  };
}

/**
 * Render rotated image to an offscreen canvas
 */
export function createRotatedCanvas(
  image: HTMLImageElement,
  rotation: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context for rotation');

  const rotRad = (rotation * Math.PI) / 180;
  const isRotated90or270 = Math.abs(rotation % 180) === 90;

  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  canvas.width = isRotated90or270 ? originalHeight : originalWidth;
  canvas.height = isRotated90or270 ? originalWidth : originalHeight;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -originalWidth / 2, -originalHeight / 2);

  return canvas;
}

/**
 * Apply crop to rotated canvas
 */
export function createCroppedCanvas(
  rotatedCanvas: HTMLCanvasElement,
  cropArea: CropAreaPixels
): HTMLCanvasElement {
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) throw new Error('Failed to get 2D canvas context for crop');

  // Ensure crop boundaries are within source bounds
  const x = Math.max(0, Math.min(cropArea.x, rotatedCanvas.width));
  const y = Math.max(0, Math.min(cropArea.y, rotatedCanvas.height));
  const width = Math.min(cropArea.width, rotatedCanvas.width - x);
  const height = Math.min(cropArea.height, rotatedCanvas.height - y);

  cropCanvas.width = Math.max(1, Math.round(width));
  cropCanvas.height = Math.max(1, Math.round(height));

  cropCtx.drawImage(
    rotatedCanvas,
    Math.round(x),
    Math.round(y),
    cropCanvas.width,
    cropCanvas.height,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  return cropCanvas;
}

/**
 * Apply brightness, contrast, and grayscale filters to pixel data directly
 */
export function applyPixelFilters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number,
  contrast: number,
  grayscale: boolean
): void {
  // If all filters are at default, skip expensive pixel loop
  if (brightness === 100 && contrast === 100 && !grayscale) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const brightnessFactor = brightness / 100;
  const c = contrast - 100; // -100 to 100
  const contrastFactor =
    contrast !== 100 ? (259 * (c + 255)) / (255 * (259 - c)) : 1;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Grayscale
    if (grayscale) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray;
      g = gray;
      b = gray;
    }

    // Brightness (scaling from 0 to 2.0)
    if (brightness !== 100) {
      r = r * brightnessFactor;
      g = g * brightnessFactor;
      b = b * brightnessFactor;
    }

    // Contrast adjustment around midpoint 128
    if (contrast !== 100) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Clamp values
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Execute the complete non-destructive image transformation pipeline:
 * 1. Load original image
 * 2. Rotate
 * 3. Crop
 * 4. Apply brightness, contrast, and grayscale
 * 5. Export as File + preview Object URL
 */
export async function processEditedImage(
  originalSrc: string,
  config: ImageEditorConfig,
  filename: string,
  mimeType: string = 'image/png'
): Promise<{
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}> {
  const image = await loadImageElement(originalSrc);

  // 1. Rotate
  const rotatedCanvas = createRotatedCanvas(image, config.rotation);

  // 2. Crop
  let finalCanvas: HTMLCanvasElement;
  if (config.cropAreaPixels && config.cropAreaPixels.width > 0 && config.cropAreaPixels.height > 0) {
    finalCanvas = createCroppedCanvas(rotatedCanvas, config.cropAreaPixels);
  } else {
    finalCanvas = rotatedCanvas;
  }

  // 3. Pixel adjustments
  const ctx = finalCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available for pixel processing');

  applyPixelFilters(
    ctx,
    finalCanvas.width,
    finalCanvas.height,
    config.brightness,
    config.contrast,
    config.grayscale
  );

  // 4. Export as Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    finalCanvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Canvas export to blob failed'));
      },
      mimeType,
      0.95
    );
  });

  const file = new File([blob], filename, { type: mimeType });
  const previewUrl = URL.createObjectURL(blob);

  return {
    file,
    previewUrl,
    width: finalCanvas.width,
    height: finalCanvas.height,
  };
}
