import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OCRResults } from '../components/OCRResults';
import { OCRResultData } from '../types';

describe('OCRResults', () => {
  const mockResult: OCRResultData = {
    text: 'Invoice Number: 12345\nTotal Due: $100.00',
    confidence: 96,
    wordCount: 5,
    charCount: 41,
    linesCount: 2,
  };

  it('renders extracted text and metadata correctly', () => {
    const handleTextChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <OCRResults
        result={mockResult}
        fileName="invoice.png"
        onTextChange={handleTextChange}
        onReset={handleReset}
      />
    );

    expect(screen.getByText('Extracted Text')).toBeInTheDocument();
    expect(screen.getByText('96% confidence')).toBeInTheDocument();
    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe(mockResult.text);
  });

  it('calls onTextChange when editing text', () => {
    const handleTextChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <OCRResults
        result={mockResult}
        fileName="invoice.png"
        onTextChange={handleTextChange}
        onReset={handleReset}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Updated text content' } });

    expect(handleTextChange).toHaveBeenCalledWith('Updated text content');
  });

  it('calls onReset when clicking Start Again', () => {
    const handleTextChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <OCRResults
        result={mockResult}
        fileName="invoice.png"
        onTextChange={handleTextChange}
        onReset={handleReset}
      />
    );

    const resetButton = screen.getByRole('button', { name: /start again/i });
    fireEvent.click(resetButton);

    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
