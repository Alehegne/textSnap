let pastedImageCounter = 1;

/**
 * Reset pasted image counter (mainly for testing)
 */
export function resetPastedImageCounter(): void {
  pastedImageCounter = 1;
}

/**
 * Determine file extension from MIME type
 */
function getExtensionFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

/**
 * Generate a friendly filename for unnamed pasted images
 */
export function generatePastedFilename(mimeType: string = 'image/png'): string {
  const ext = getExtensionFromMime(mimeType);
  const name = `Pasted Image ${pastedImageCounter}.${ext}`;
  pastedImageCounter += 1;
  return name;
}

/**
 * Check if the event target is an active input/textarea or contenteditable element
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') return true;
  if (
    target.isContentEditable ||
    target.contentEditable === 'true' ||
    target.getAttribute('contenteditable') === 'true' ||
    target.getAttribute('contenteditable') === ''
  ) {
    return true;
  }
  return false;
}

/**
 * Extract image files from DataTransfer (used in onPaste event)
 */
export function extractImagesFromDataTransfer(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer || !dataTransfer.items) return [];

  const files: File[] = [];

  for (let i = 0; i < dataTransfer.items.length; i++) {
    const item = dataTransfer.items[i];
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        // If the browser provides a generic or empty name, give it a friendly indexed name
        const isGenericName = !file.name || file.name === 'image.png' || file.name === 'blob';
        const finalFile = isGenericName
          ? new File([file], generatePastedFilename(file.type), { type: file.type })
          : file;
        files.push(finalFile);
      }
    }
  }

  // Fallback to dataTransfer.files if items was empty
  if (files.length === 0 && dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files[i];
      if (file.type.startsWith('image/')) {
        files.push(file);
      }
    }
  }

  return files;
}

/**
 * Read image files directly from navigator.clipboard API
 */
export async function readImagesFromClipboardApi(): Promise<{
  files: File[];
  error?: string;
}> {
  if (!navigator.clipboard) {
    return {
      files: [],
      error: 'Clipboard API is not supported in this browser. Please use Ctrl+V or Cmd+V to paste.',
    };
  }

  if (typeof navigator.clipboard.read !== 'function') {
    return {
      files: [],
      error: 'Reading image data from clipboard is not supported in this browser. Please use Ctrl+V or Cmd+V to paste.',
    };
  }

  try {
    const clipboardItems = await navigator.clipboard.read();
    const files: File[] = [];

    for (const item of clipboardItems) {
      const imageType = item.types.find((t) => t.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        const filename = generatePastedFilename(imageType);
        const file = new File([blob], filename, { type: imageType });
        files.push(file);
      }
    }

    if (files.length === 0) {
      return {
        files: [],
        error: 'No image found in clipboard. Take a screenshot or copy an image first.',
      };
    }

    return { files };
  } catch (err: unknown) {
    const errorObj = err as Error;
    if (errorObj?.name === 'NotAllowedError') {
      return {
        files: [],
        error: 'Clipboard access was denied. Please allow clipboard permissions or use keyboard shortcut Ctrl+V / Cmd+V.',
      };
    }
    return {
      files: [],
      error: errorObj?.message || 'Failed to read clipboard contents. Try pressing Ctrl+V or Cmd+V directly.',
    };
  }
}
