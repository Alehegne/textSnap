import { describe, it, expect } from 'vitest';
import {
  createRotatedCanvas,
  createCroppedCanvas,
  applyPixelFilters,
} from '../services/imageProcessingService';

describe('imageProcessingService', () => {
  describe('createRotatedCanvas', () => {
    it('preserves dimensions on 0 and 180 degree rotation', () => {
      const mockImg = {
        naturalWidth: 400,
        naturalHeight: 300,
        width: 400,
        height: 300,
      } as unknown as HTMLImageElement;

      const canvas0 = createRotatedCanvas(mockImg, 0);
      expect(canvas0.width).toBe(400);
      expect(canvas0.height).toBe(300);

      const canvas180 = createRotatedCanvas(mockImg, 180);
      expect(canvas180.width).toBe(400);
      expect(canvas180.height).toBe(300);
    });

    it('swaps width and height on 90 and 270 degree rotation', () => {
      const mockImg = {
        naturalWidth: 400,
        naturalHeight: 300,
        width: 400,
        height: 300,
      } as unknown as HTMLImageElement;

      const canvas90 = createRotatedCanvas(mockImg, 90);
      expect(canvas90.width).toBe(300);
      expect(canvas90.height).toBe(400);

      const canvas270 = createRotatedCanvas(mockImg, 270);
      expect(canvas270.width).toBe(300);
      expect(canvas270.height).toBe(400);
    });
  });

  describe('createCroppedCanvas', () => {
    it('creates canvas with dimensions matching the crop area', () => {
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = 600;
      sourceCanvas.height = 400;

      const cropped = createCroppedCanvas(sourceCanvas, {
        x: 50,
        y: 50,
        width: 300,
        height: 200,
      });

      expect(cropped.width).toBe(300);
      expect(cropped.height).toBe(200);
    });

    it('clamps crop bounds within source canvas boundaries', () => {
      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = 500;
      sourceCanvas.height = 300;

      const cropped = createCroppedCanvas(sourceCanvas, {
        x: 400,
        y: 200,
        width: 250, // exceeds right edge (400 + 250 > 500)
        height: 200, // exceeds bottom edge (200 + 200 > 300)
      });

      expect(cropped.width).toBe(100); // 500 - 400
      expect(cropped.height).toBe(100); // 300 - 200
    });
  });

  describe('applyPixelFilters', () => {
    it('skips pixel modification when all filters are at default neutral settings', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d')!;

      const before = ctx.getImageData(0, 0, 2, 2).data;
      const originalR = before[0];

      // Default: brightness 100, contrast 100, grayscale false
      applyPixelFilters(ctx, 2, 2, 100, 100, false);

      const after = ctx.getImageData(0, 0, 2, 2).data;
      expect(after[0]).toBe(originalR);
    });

    it('converts pixels to grayscale when enabled', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d')!;

      applyPixelFilters(ctx, 2, 2, 100, 100, true);

      const data = ctx.getImageData(0, 0, 2, 2).data;
      // 0.299 * 100 + 0.587 * 100 + 0.114 * 100 = 100
      expect(data[0]).toBe(100);
      expect(data[1]).toBe(100);
      expect(data[2]).toBe(100);
    });

    it('adjusts brightness accordingly', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d')!;

      // Increase brightness to 150% (initial is 100 -> 100 * 1.5 = 150)
      applyPixelFilters(ctx, 2, 2, 150, 100, false);

      const data = ctx.getImageData(0, 0, 2, 2).data;
      expect(data[0]).toBe(150);
      expect(data[1]).toBe(150);
      expect(data[2]).toBe(150);
    });
  });
});
