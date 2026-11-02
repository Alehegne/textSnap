import '@testing-library/jest-dom';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock URL.createObjectURL and URL.revokeObjectURL
if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = () => 'blob:mock-url';
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
  window.URL.revokeObjectURL = () => {};
}

// Mock Clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: async () => {},
    readText: async () => '',
  },
});

// Mock Canvas 2D context for jsdom environment
HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextType: string
) {
  if (contextType === '2d') {
    const canvas = this;
    let storedData: Uint8ClampedArray | null = null;

    return {
      canvas,
      fillStyle: '#000000',
      font: '10px sans-serif',
      drawImage: () => {},
      translate: () => {},
      rotate: () => {},
      fillRect: () => {},
      fillText: () => {},
      getImageData: (_x: number, _y: number, w: number, h: number) => {
        const length = w * h * 4;
        if (!storedData || storedData.length !== length) {
          storedData = new Uint8ClampedArray(length);
          for (let i = 0; i < length; i += 4) {
            storedData[i] = 100;
            storedData[i + 1] = 100;
            storedData[i + 2] = 100;
            storedData[i + 3] = 255;
          }
        }
        return {
          data: storedData,
          width: w,
          height: h,
          colorSpace: 'srgb',
        } as ImageData;
      },
      putImageData: (imageData: ImageData) => {
        storedData = new Uint8ClampedArray(imageData.data);
      },
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
} as any;

HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
  callback(new Blob(['mock-image-data'], { type: 'image/png' }));
};
