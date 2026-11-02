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

export type QueueItemStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface CropAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageEditorConfig {
  rotation: number; // 0, 90, 180, 270
  brightness: number; // 0 to 200, default 100
  contrast: number; // 0 to 200, default 100
  grayscale: boolean; // default false
  cropAreaPixels: CropAreaPixels | null;
  crop: { x: number; y: number };
  zoom: number;
}

export const DEFAULT_EDITOR_CONFIG: ImageEditorConfig = {
  rotation: 0,
  brightness: 100,
  contrast: 100,
  grayscale: false,
  cropAreaPixels: null,
  crop: { x: 0, y: 0 },
  zoom: 1,
};

export interface QueueItem {
  id: string;
  originalFile?: File; // Pristine uploaded file (never mutated)
  file: File; // Active file for OCR (original or edited)
  previewUrl: string; // Current active preview URL
  originalPreviewUrl?: string; // Original preview URL
  filename: string;
  fileSize: number;
  status: QueueItemStatus;
  progress: number; // 0 to 1
  progressStatus?: string;
  extractedText: string;
  confidence: number;
  wordCount: number;
  charCount: number;
  linesCount: number;
  error: string | null;
  timestamp: number;
  editorConfig?: ImageEditorConfig;
  isEdited?: boolean;
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

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
