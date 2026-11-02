import { useState, useCallback, useEffect, useRef } from 'react';
import { OCRProgress, OCRResultData, OCRStatus } from '../types';
import { ocrService } from '../services/ocrService';
import { calculateTextStats } from '../services/imageService';

export interface UseOCRReturn {
  status: OCRStatus;
  progress: OCRProgress;
  result: OCRResultData | null;
  error: string | null;
  processImage: (imageSource: string | HTMLCanvasElement | Blob) => Promise<OCRResultData | null>;
  setText: (newText: string) => void;
  resetOCR: () => void;
  terminateWorker: () => Promise<void>;
}

export function useOCR(): UseOCRReturn {
  const [status, setStatus] = useState<OCRStatus>('idle');
  const [progress, setProgress] = useState<OCRProgress>({ status: '', progress: 0 });
  const [result, setResult] = useState<OCRResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep track of unmount
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      ocrService.terminate();
    };
  }, []);

  const resetOCR = useCallback(() => {
    setStatus('idle');
    setProgress({ status: '', progress: 0 });
    setResult(null);
    setError(null);
  }, []);

  const setText = useCallback((newText: string) => {
    setResult((prev) => {
      const stats = calculateTextStats(newText);
      return {
        text: newText,
        confidence: prev ? prev.confidence : 100,
        wordCount: stats.wordCount,
        charCount: stats.charCount,
        linesCount: stats.linesCount,
      };
    });
  }, []);

  const processImage = useCallback(
    async (imageSource: string | HTMLCanvasElement | Blob): Promise<OCRResultData | null> => {
      setStatus('loading');
      setError(null);
      setProgress({ status: 'Starting OCR engine...', progress: 0.05 });

      try {
        const data = await ocrService.recognize(imageSource, (prog) => {
          if (isMountedRef.current) {
            setProgress(prog);
            if (prog.progress > 0 && prog.progress < 1) {
              setStatus('processing');
            }
          }
        });

        if (isMountedRef.current) {
          setResult(data);
          setStatus('success');
          setProgress({ status: 'Completed', progress: 1 });
        }
        return data;
      } catch (err) {
        if (isMountedRef.current) {
          const message =
            err instanceof Error
              ? err.message
              : 'Failed to extract text from the image. Please try again.';
          setError(message);
          setStatus('error');
          setProgress({ status: 'Error occurred', progress: 0 });
        }
        return null;
      }
    },
    []
  );

  const terminateWorker = useCallback(async () => {
    await ocrService.terminate();
  }, []);

  return {
    status,
    progress,
    result,
    error,
    processImage,
    setText,
    resetOCR,
    terminateWorker,
  };
}
