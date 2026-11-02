import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CombinedResults, formatCombinedResults } from '../components/CombinedResults';
import { QueueItem } from '../types';

describe('CombinedResults', () => {
  const mockCompletedItems: QueueItem[] = [
    {
      id: 'item_1',
      file: new File([''], 'Invoice.png', { type: 'image/png' }),
      previewUrl: 'blob:url1',
      filename: 'Invoice.png',
      fileSize: 2048,
      status: 'completed',
      progress: 1,
      extractedText: 'Invoice Total: $500.00\nDue Date: 2026-11-05',
      confidence: 95,
      wordCount: 6,
      charCount: 42,
      linesCount: 2,
      error: null,
      timestamp: 1000,
    },
    {
      id: 'item_2',
      file: new File([''], 'Screenshot.png', { type: 'image/png' }),
      previewUrl: 'blob:url2',
      filename: 'Screenshot.png',
      fileSize: 4096,
      status: 'completed',
      progress: 1,
      extractedText: 'Error 404: Not Found\nPlease check your URL.',
      confidence: 88,
      wordCount: 7,
      charCount: 42,
      linesCount: 2,
      error: null,
      timestamp: 2000,
    },
  ];

  describe('formatCombinedResults', () => {
    it('formats results using standard header separators in original queue order', () => {
      const output = formatCombinedResults(mockCompletedItems);

      expect(output).toContain('--- Invoice.png ---');
      expect(output).toContain('Invoice Total: $500.00\nDue Date: 2026-11-05');
      expect(output).toContain('--- Screenshot.png ---');
      expect(output).toContain('Error 404: Not Found\nPlease check your URL.');

      // Check order
      const invoiceIndex = output.indexOf('--- Invoice.png ---');
      const screenshotIndex = output.indexOf('--- Screenshot.png ---');
      expect(invoiceIndex).toBeLessThan(screenshotIndex);
    });

    it('ignores items that failed or have empty text', () => {
      const itemsWithFailed: QueueItem[] = [
        ...mockCompletedItems,
        {
          id: 'item_3',
          file: new File([''], 'Empty.png', { type: 'image/png' }),
          previewUrl: 'blob:url3',
          filename: 'Empty.png',
          fileSize: 1024,
          status: 'completed',
          progress: 1,
          extractedText: '   ',
          confidence: 0,
          wordCount: 0,
          charCount: 0,
          linesCount: 0,
          error: null,
          timestamp: 3000,
        },
        {
          id: 'item_4',
          file: new File([''], 'Failed.png', { type: 'image/png' }),
          previewUrl: 'blob:url4',
          filename: 'Failed.png',
          fileSize: 1024,
          status: 'failed',
          progress: 0,
          extractedText: '',
          confidence: 0,
          wordCount: 0,
          charCount: 0,
          linesCount: 0,
          error: 'OCR error',
          timestamp: 4000,
        },
      ];

      const output = formatCombinedResults(itemsWithFailed);
      expect(output).not.toContain('--- Empty.png ---');
      expect(output).not.toContain('--- Failed.png ---');
    });
  });

  describe('CombinedResults Component', () => {
    it('renders combined text and image count badge', () => {
      render(<CombinedResults completedItems={mockCompletedItems} />);

      expect(screen.getByText('Combined Extractions')).toBeInTheDocument();
      expect(screen.getByText('2 images included')).toBeInTheDocument();

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toContain('--- Invoice.png ---');
      expect(textarea.value).toContain('--- Screenshot.png ---');
    });

    it('allows editing combined text without losing edits immediately', () => {
      render(<CombinedResults completedItems={mockCompletedItems} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Custom combined edited text' } });

      expect(textarea).toHaveValue('Custom combined edited text');
      // Re-combine button should now appear
      expect(screen.getByRole('button', { name: /re-combine/i })).toBeInTheDocument();
    });
  });
});
