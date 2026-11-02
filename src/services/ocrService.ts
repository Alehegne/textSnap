import { createWorker, Worker } from 'tesseract.js';
import { OCRProgress, OCRResultData } from '../types';
import { calculateTextStats } from './imageService';

class OCRService {
  private worker: Worker | null = null;
  private workerInitPromise: Promise<Worker> | null = null;
  private currentProgressCallback: ((progress: OCRProgress) => void) | null = null;

  /**
   * Get or initialize the shared Tesseract worker.
   */
  public async getWorker(onProgress?: (progress: OCRProgress) => void): Promise<Worker> {
    this.currentProgressCallback = onProgress || null;

    if (this.worker) {
      return this.worker;
    }

    if (this.workerInitPromise) {
      return this.workerInitPromise;
    }

    this.workerInitPromise = (async () => {
      try {
        const worker = await createWorker('eng', 1, {
          logger: (m) => {
            if (this.currentProgressCallback && m) {
              const statusStr = typeof m.status === 'string' ? m.status : 'Processing image';
              const progressVal = typeof m.progress === 'number' ? Math.max(0, Math.min(1, m.progress)) : 0;
              this.currentProgressCallback({
                status: this.formatStatusMessage(statusStr),
                progress: progressVal,
              });
            }
          },
        });

        this.worker = worker;
        return worker;
      } catch (err) {
        this.worker = null;
        this.workerInitPromise = null;
        throw new Error(
          'Failed to initialize OCR engine. Please ensure an active internet connection to download the OCR model files.' +
            (err instanceof Error ? ` (${err.message})` : '')
        );
      } finally {
        this.workerInitPromise = null;
      }
    })();

    return this.workerInitPromise;
  }

  /**
   * Clean readable status text for UI
   */
  private formatStatusMessage(rawStatus: string): string {
    const map: Record<string, string> = {
      'loading tesseract core': 'Loading OCR Core Engine...',
      'loaded tesseract core': 'Core engine loaded',
      'initializing tesseract': 'Initializing OCR Engine...',
      'initialized tesseract': 'Engine initialized',
      'loading language traineddata': 'Downloading English language model...',
      'loading language traineddata (from cache)': 'Loading cached English language model...',
      'loaded language traineddata': 'Language model loaded',
      'initializing api': 'Preparing text recognition...',
      'initialized api': 'Ready for recognition',
      'recognizing text': 'Analyzing and recognizing text...',
    };

    return map[rawStatus.toLowerCase()] || rawStatus;
  }

  /**
   * Perform text recognition on an image source (URL, Blob, or Canvas/ImageData).
   */
  public async recognize(
    imageSource: string | HTMLCanvasElement | Blob,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResultData> {
    try {
      this.currentProgressCallback = onProgress || null;
      const worker = await this.getWorker(onProgress);

      const ret = await worker.recognize(imageSource);
      const text = ret.data?.text || '';
      const confidence = typeof ret.data?.confidence === 'number' ? Math.round(ret.data.confidence) : 0;
      const stats = calculateTextStats(text);

      return {
        text,
        confidence,
        wordCount: stats.wordCount,
        charCount: stats.charCount,
        linesCount: stats.linesCount,
      };
    } catch (error) {
      console.error('OCR Recognition Error:', error);
      throw error instanceof Error
        ? error
        : new Error('An unexpected error occurred during OCR text extraction.');
    } finally {
      this.currentProgressCallback = null;
    }
  }

  /**
   * Terminate the worker and release resources.
   */
  public async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (err) {
        console.warn('Error while terminating OCR worker:', err);
      } finally {
        this.worker = null;
        this.workerInitPromise = null;
        this.currentProgressCallback = null;
      }
    }
  }
}

export const ocrService = new OCRService();
