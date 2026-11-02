import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageQueue } from '../hooks/useImageQueue';

describe('useImageQueue', () => {
  it('adds multiple valid files to the queue with unique IDs', () => {
    const { result } = renderHook(() => useImageQueue());

    const file1 = new File(['file1 content'], 'document.png', { type: 'image/png' });
    const file2 = new File(['file2 content'], 'receipt.jpg', { type: 'image/jpeg' });
    const file3 = new File(['file3 content'], 'document.png', { type: 'image/png' }); // duplicate filename

    act(() => {
      const res = result.current.addFiles([file1, file2, file3]);
      expect(res.addedCount).toBe(3);
      expect(res.rejectedCount).toBe(0);
    });

    expect(result.current.queue.length).toBe(3);

    // Ensure all IDs are unique even for duplicate filenames
    const ids = result.current.queue.map((item) => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);

    // Initial status should be queued
    expect(result.current.queue.every((item) => item.status === 'queued')).toBe(true);
  });

  it('rejects unsupported file formats', () => {
    const { result } = renderHook(() => useImageQueue());

    const pdfFile = new File(['pdf data'], 'manual.pdf', { type: 'application/pdf' });
    const txtFile = new File(['plain text'], 'notes.txt', { type: 'text/plain' });

    act(() => {
      const res = result.current.addFiles([pdfFile, txtFile]);
      expect(res.addedCount).toBe(0);
      expect(res.rejectedCount).toBe(2);
      expect(res.errors.length).toBe(2);
    });

    expect(result.current.queue.length).toBe(0);
  });

  it('rejects files exceeding 8 MB size limit', () => {
    const { result } = renderHook(() => useImageQueue());

    // Create a mock large file > 8 MB (8 * 1024 * 1024 + 1 bytes)
    const largeSize = 8 * 1024 * 1024 + 100;
    const largeFile = new File(['x'], 'huge.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: largeSize });

    act(() => {
      const res = result.current.addFiles([largeFile]);
      expect(res.addedCount).toBe(0);
      expect(res.rejectedCount).toBe(1);
      expect(res.errors[0]).toContain('Exceeds 8 MB limit');
    });

    expect(result.current.queue.length).toBe(0);
  });

  it('removes an individual item from the queue', () => {
    const { result } = renderHook(() => useImageQueue());

    const file1 = new File(['1'], 'doc1.png', { type: 'image/png' });
    const file2 = new File(['2'], 'doc2.png', { type: 'image/png' });

    act(() => {
      result.current.addFiles([file1, file2]);
    });

    expect(result.current.queue.length).toBe(2);
    const firstId = result.current.queue[0].id;

    act(() => {
      result.current.removeQueueItem(firstId);
    });

    expect(result.current.queue.length).toBe(1);
    expect(result.current.queue[0].id).not.toBe(firstId);
  });

  it('clears the entire queue', () => {
    const { result } = renderHook(() => useImageQueue());

    const file1 = new File(['1'], 'doc1.png', { type: 'image/png' });
    const file2 = new File(['2'], 'doc2.png', { type: 'image/png' });

    act(() => {
      result.current.addFiles([file1, file2]);
    });

    expect(result.current.queue.length).toBe(2);

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.queue.length).toBe(0);
    expect(result.current.activeItemId).toBeNull();
  });

  it('updates item text and recalculates word and character counts', () => {
    const { result } = renderHook(() => useImageQueue());

    const file = new File(['1'], 'doc.png', { type: 'image/png' });

    act(() => {
      result.current.addFiles([file]);
    });

    const itemId = result.current.queue[0].id;

    act(() => {
      result.current.updateItemText(itemId, 'Recognized line one\nLine two with five words');
    });

    const updated = result.current.queue[0];
    expect(updated.extractedText).toBe('Recognized line one\nLine two with five words');
    expect(updated.linesCount).toBe(2);
    expect(updated.wordCount).toBe(8);
  });

  describe('Non-destructive editing', () => {
    it('applies edited transformations without mutating the original file', () => {
      const { result } = renderHook(() => useImageQueue());

      const originalFile = new File(['original data'], 'photo.png', { type: 'image/png' });

      act(() => {
        result.current.addFiles([originalFile]);
      });

      const item = result.current.queue[0];
      expect(item.originalFile).toBe(originalFile);
      expect(item.isEdited).toBe(false);

      const editedFile = new File(['cropped & rotated data'], 'photo.png', { type: 'image/png' });
      const editedConfig = {
        rotation: 90,
        brightness: 120,
        contrast: 110,
        grayscale: true,
        cropAreaPixels: { x: 10, y: 10, width: 200, height: 150 },
        crop: { x: 0, y: 0 },
        zoom: 1,
      };

      act(() => {
        result.current.updateEditedItem(item.id, editedFile, 'blob:edited-url', editedConfig);
      });

      const updatedItem = result.current.queue[0];
      expect(updatedItem.file).toBe(editedFile);
      expect(updatedItem.originalFile).toBe(originalFile); // Original stays pristine!
      expect(updatedItem.isEdited).toBe(true);
      expect(updatedItem.editorConfig?.rotation).toBe(90);
      expect(updatedItem.editorConfig?.grayscale).toBe(true);
    });

    it('isolates edits between different items in the queue', () => {
      const { result } = renderHook(() => useImageQueue());

      const file1 = new File(['1'], 'doc1.png', { type: 'image/png' });
      const file2 = new File(['2'], 'doc2.png', { type: 'image/png' });

      act(() => {
        result.current.addFiles([file1, file2]);
      });

      const item1Id = result.current.queue[0].id;
      const editedFile = new File(['edited1'], 'doc1.png', { type: 'image/png' });

      act(() => {
        result.current.updateEditedItem(item1Id, editedFile, 'blob:edited1', {
          rotation: 180,
          brightness: 150,
          contrast: 100,
          grayscale: false,
          cropAreaPixels: null,
          crop: { x: 0, y: 0 },
          zoom: 1,
        });
      });

      // Item 1 is edited
      expect(result.current.queue[0].isEdited).toBe(true);
      expect(result.current.queue[0].editorConfig?.rotation).toBe(180);

      // Item 2 is completely unaffected
      expect(result.current.queue[1].isEdited).toBe(false);
      expect(result.current.queue[1].editorConfig?.rotation).toBe(0);
    });

    it('resets an edited item back to its original file and defaults', () => {
      const { result } = renderHook(() => useImageQueue());

      const originalFile = new File(['original'], 'doc.png', { type: 'image/png' });

      act(() => {
        result.current.addFiles([originalFile]);
      });

      const itemId = result.current.queue[0].id;

      act(() => {
        result.current.updateEditedItem(itemId, new File(['edited'], 'doc.png', { type: 'image/png' }), 'blob:edited', {
          rotation: 270,
          brightness: 80,
          contrast: 130,
          grayscale: true,
          cropAreaPixels: null,
          crop: { x: 0, y: 0 },
          zoom: 1,
        });
      });

      expect(result.current.queue[0].isEdited).toBe(true);

      act(() => {
        result.current.resetItemToOriginal(itemId);
      });

      const restoredItem = result.current.queue[0];
      expect(restoredItem.file).toBe(originalFile);
      expect(restoredItem.isEdited).toBe(false);
      expect(restoredItem.editorConfig?.rotation).toBe(0);
    });
  });
});
