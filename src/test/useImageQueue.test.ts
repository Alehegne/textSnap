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
});
