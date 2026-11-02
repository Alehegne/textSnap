import { describe, it, expect, beforeEach } from 'vitest';
import {
  isEditableTarget,
  generatePastedFilename,
  resetPastedImageCounter,
  extractImagesFromDataTransfer,
} from '../services/clipboardService';

describe('clipboardService', () => {
  beforeEach(() => {
    resetPastedImageCounter();
  });

  describe('isEditableTarget', () => {
    it('returns true for input elements', () => {
      const input = document.createElement('input');
      expect(isEditableTarget(input)).toBe(true);
    });

    it('returns true for textarea elements', () => {
      const textarea = document.createElement('textarea');
      expect(isEditableTarget(textarea)).toBe(true);
    });

    it('returns true for contenteditable elements', () => {
      const div = document.createElement('div');
      div.contentEditable = 'true';
      expect(isEditableTarget(div)).toBe(true);
    });

    it('returns false for regular div or body elements', () => {
      const div = document.createElement('div');
      const button = document.createElement('button');
      expect(isEditableTarget(div)).toBe(false);
      expect(isEditableTarget(button)).toBe(false);
      expect(isEditableTarget(null)).toBe(false);
    });
  });

  describe('generatePastedFilename', () => {
    it('generates sequential friendly filenames', () => {
      expect(generatePastedFilename('image/png')).toBe('Pasted Image 1.png');
      expect(generatePastedFilename('image/jpeg')).toBe('Pasted Image 2.jpg');
      expect(generatePastedFilename('image/webp')).toBe('Pasted Image 3.webp');
      expect(generatePastedFilename('image/png')).toBe('Pasted Image 4.png');
    });
  });

  describe('extractImagesFromDataTransfer', () => {
    it('returns empty array if no items or files exist', () => {
      const dt = {
        items: [] as unknown as DataTransferItemList,
        files: [] as unknown as FileList,
      } as DataTransfer;

      expect(extractImagesFromDataTransfer(dt)).toEqual([]);
      expect(extractImagesFromDataTransfer(null)).toEqual([]);
    });

    it('extracts images from clipboard items', () => {
      const mockFile = new File(['mock content'], 'screenshot.png', { type: 'image/png' });
      const mockItem = {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => mockFile,
      };

      const dt = {
        items: [mockItem] as unknown as DataTransferItemList,
        files: [mockFile] as unknown as FileList,
      } as DataTransfer;

      const extracted = extractImagesFromDataTransfer(dt);
      expect(extracted.length).toBe(1);
      expect(extracted[0].name).toBe('screenshot.png');
    });

    it('renames generic image names (e.g. image.png or blob) to Pasted Image #.png', () => {
      const genericFile = new File(['data'], 'image.png', { type: 'image/png' });
      const mockItem = {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => genericFile,
      };

      const dt = {
        items: [mockItem] as unknown as DataTransferItemList,
        files: [genericFile] as unknown as FileList,
      } as DataTransfer;

      const extracted = extractImagesFromDataTransfer(dt);
      expect(extracted.length).toBe(1);
      expect(extracted[0].name).toBe('Pasted Image 1.png');
    });

    it('ignores non-image clipboard items like plain text', () => {
      const textItem = {
        kind: 'string',
        type: 'text/plain',
        getAsFile: () => null,
      };

      const dt = {
        items: [textItem] as unknown as DataTransferItemList,
        files: [] as unknown as FileList,
      } as DataTransfer;

      const extracted = extractImagesFromDataTransfer(dt);
      expect(extracted.length).toBe(0);
    });
  });
});
