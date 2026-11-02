import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadedImage, ImagePreprocessingOptions } from '../types';
import { DEFAULT_PREPROCESSING, preprocessImage } from '../services/imageService';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UseImageUploadReturn {
  image: UploadedImage | null;
  processedPreviewUrl: string | null;
  preprocessing: ImagePreprocessingOptions;
  error: string | null;
  isPreprocessing: boolean;
  handleFileSelect: (file: File) => boolean;
  clearImage: () => void;
  updatePreprocessing: (updater: Partial<ImagePreprocessingOptions>) => void;
  resetPreprocessing: () => void;
  setError: (error: string | null) => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [preprocessing, setPreprocessing] = useState<ImagePreprocessingOptions>(DEFAULT_PREPROCESSING);
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);
  const [isPreprocessing, setIsPreprocessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep track of created object URLs to safely revoke them
  const activeUrlRef = useRef<string | null>(null);

  const cleanupActiveUrl = useCallback(() => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupActiveUrl();
    };
  }, [cleanupActiveUrl]);

  const clearImage = useCallback(() => {
    cleanupActiveUrl();
    setImage(null);
    setProcessedPreviewUrl(null);
    setError(null);
  }, [cleanupActiveUrl]);

  const handleFileSelect = useCallback(
    (file: File): boolean => {
      setError(null);

      // Validate MIME type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`Unsupported file type (${file.type || 'unknown'}). Please upload a JPG, PNG, or WebP image.`);
        return false;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(
          `File size exceeds 8 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a smaller image.`
        );
        return false;
      }

      // Revoke previous URL if any
      cleanupActiveUrl();

      const objectUrl = URL.createObjectURL(file);
      activeUrlRef.current = objectUrl;

      // Extract image dimensions
      const img = new Image();
      img.onload = () => {
        setImage({
          file,
          previewUrl: objectUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };
      img.onerror = () => {
        // Fallback without natural dimensions
        setImage({
          file,
          previewUrl: objectUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        });
      };
      img.src = objectUrl;

      return true;
    },
    [cleanupActiveUrl]
  );

  // Apply preprocessing when options or source image change
  useEffect(() => {
    if (!image) {
      setProcessedPreviewUrl(null);
      return;
    }

    if (!preprocessing.enabled) {
      setProcessedPreviewUrl(null);
      return;
    }

    let isMounted = true;
    setIsPreprocessing(true);

    const debounceTimer = setTimeout(() => {
      preprocessImage(image.previewUrl, preprocessing)
        .then((resultDataUrl) => {
          if (isMounted) {
            setProcessedPreviewUrl(resultDataUrl);
            setIsPreprocessing(false);
          }
        })
        .catch((err) => {
          console.error('Preprocessing failed:', err);
          if (isMounted) {
            setIsPreprocessing(false);
          }
        });
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [image, preprocessing]);

  const updatePreprocessing = useCallback((updater: Partial<ImagePreprocessingOptions>) => {
    setPreprocessing((prev) => ({ ...prev, ...updater }));
  }, []);

  const resetPreprocessing = useCallback(() => {
    setPreprocessing(DEFAULT_PREPROCESSING);
  }, []);

  return {
    image,
    processedPreviewUrl,
    preprocessing,
    error,
    isPreprocessing,
    handleFileSelect,
    clearImage,
    updatePreprocessing,
    resetPreprocessing,
    setError,
  };
}
