export type OCRStatus =
  | 'idle'
  | 'initializing'
  | 'loading'
  | 'processing'
  | 'success'
  | 'error';

export interface OCRProgress {
  status: string;
  progress: number; // 0 to 1
}

export interface OCRResultData {
  text: string;
  confidence: number;
  wordCount: number;
  charCount: number;
  linesCount: number;
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string;
  fileSize: number;
  text: string;
  wordCount: number;
  charCount: number;
  confidence: number;
}

export interface ImagePreprocessingOptions {
  enabled: boolean;
  grayscale: boolean;
  contrast: number; // -100 to 100, 0 is normal
  brightness: number; // -100 to 100, 0 is normal
  binarize: boolean; // thresholding
  binarizeThreshold: number; // 0 to 255
  invert: boolean;
}

export type Theme = 'light' | 'dark' | 'system';
