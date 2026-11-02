import { useEffect, useCallback } from 'react';
import {
  extractImagesFromDataTransfer,
  readImagesFromClipboardApi,
  isEditableTarget,
} from '../services/clipboardService';

export interface UseClipboardImageProps {
  onImagesReceived: (files: File[]) => void;
  onNotify?: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  disabled?: boolean;
}

export interface UseClipboardImageReturn {
  pasteFromClipboard: () => Promise<void>;
}

export function useClipboardImage({
  onImagesReceived,
  onNotify,
  disabled = false,
}: UseClipboardImageProps): UseClipboardImageReturn {
  // Global document paste event listener
  useEffect(() => {
    if (disabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      // Do not interfere with normal text pasting inside input, textarea, or contenteditable
      if (isEditableTarget(e.target)) {
        return;
      }

      if (!e.clipboardData) return;

      const files = extractImagesFromDataTransfer(e.clipboardData);

      if (files.length > 0) {
        e.preventDefault();
        onImagesReceived(files);
        if (onNotify) {
          const names = files.map((f) => f.name).join(', ');
          onNotify(
            'success',
            `Pasted ${files.length} image${files.length > 1 ? 's' : ''} from clipboard: ${names}`
          );
        }
      } else {
        // If clipboard contains plain text only and user is not in an input,
        // let them know how to paste images or screenshot
        const text = e.clipboardData.getData('text/plain');
        if (text && onNotify) {
          onNotify(
            'info',
            'Clipboard contains text, but no image. Copy a screenshot or image file to paste here.'
          );
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [disabled, onImagesReceived, onNotify]);

  // Dedicated button handler using navigator.clipboard.read()
  const pasteFromClipboard = useCallback(async () => {
    if (disabled) return;

    const result = await readImagesFromClipboardApi();

    if (result.error) {
      if (onNotify) {
        onNotify('warning', result.error);
      }
      return;
    }

    if (result.files && result.files.length > 0) {
      onImagesReceived(result.files);
      if (onNotify) {
        const names = result.files.map((f) => f.name).join(', ');
        onNotify(
          'success',
          `Pasted ${result.files.length} image${result.files.length > 1 ? 's' : ''} from clipboard: ${names}`
        );
      }
    }
  }, [disabled, onImagesReceived, onNotify]);

  return {
    pasteFromClipboard,
  };
}
