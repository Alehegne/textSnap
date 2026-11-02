# TextSnap 📸 ➡️ 📝

**TextSnap** is a modern, responsive, 100% client-side Optical Character Recognition (OCR) web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Tesseract.js**.

Extract English text from receipts, documents, book pages, screenshots, and invoices directly in your web browser — **with zero server uploads, complete privacy, batch queue processing, native screenshot clipboard pasting, and no accounts or API keys required**.

![TextSnap Icon](public/favicon.svg)

---

## 🚀 What's New in V1.1: Batch OCR & Clipboard Image Pasting

- 📑 **Multiple Image Uploads & Batch Queue**: Select, drag & drop, or paste multiple images at once. Process them sequentially with a single shared Tesseract.js worker.
- 📋 **Native Clipboard Image Pasting**:
  - Press `Ctrl + V` (Windows/Linux) or `Cmd + V` (macOS) to paste screenshots directly into the queue.
  - Dedicated **"Paste Image"** button using `navigator.clipboard.read()` with automatic permission and format validation.
  - Smart target detection: normal text pasting inside inputs and textareas is never intercepted.
- 🔄 **Fault-Tolerant Queue Execution**:
  - Independent error boundaries per image: one corrupt or unreadable image does not stop the queue.
  - One-click retry for failed images.
  - Add or remove images dynamically while queue exists.
- 📑 **Combine All Results**:
  - Seamlessly compiles all completed extractions in their original queue order into a single structured document with clear `--- Document.png ---` separators.
  - Preserves recognized line breaks and allows full manual editing without accidental overwrite.
  - One-click **Copy Combined** and **Download Combined TXT**.

---

## ✨ Features

- 🔒 **100% Client-Side Privacy**: All OCR processing executes entirely inside your browser using Tesseract.js (WebAssembly). Uploaded images are **never** transmitted to any server.
- ⚡ **Drag & Drop & File Picker**: Support for **JPG**, **JPEG**, **PNG**, and **WebP** formats with file validation up to **8 MB** per image.
- 🖼️ **Safe Image Previews & Cleanup**: Uses standard Browser File and Object URL APIs with automatic memory cleanup to prevent memory leaks.
- 🛠️ **Live Image Preprocessing**:
  - Optional grayscale conversion
  - Dynamic contrast enhancement slider (-50 to +100)
  - High-contrast black & white binarization
  - Color inversion (ideal for light text on dark backgrounds)
  - Instant before/after comparison preview
- 📊 **Real-time Sequential Batch Progress**: Live progress percentage, current document index (e.g., "Processing 2 of 5"), and status events straight from the WebAssembly worker.
- 📝 **Individual Results & Editor**:
  - In-place editable textarea preserving recognized line breaks
  - Live character count, word count, and line count
  - OCR recognition confidence rating
  - Easy switching between documents via visual thumbnails or next/previous controls
- 📋 **One-Click Export**:
  - Instant clipboard copy with automatic fallback support
  - Download individual or combined formatted `.txt` files
- 🕰️ **Local Extraction History**:
  - Automatically saves recent extractions in `localStorage`
  - Restore previous results back into the editor with one click
  - Delete individual records or clear history
  - *Note: Only extracted text and metadata are stored—images are never stored in localStorage.*
- 🌓 **Dark Mode**: Fully styled modern light and dark themes with system preference detection and smooth transitions.
- 📱 **Fully Responsive**: Tailored layout for mobile, tablet, and widescreen desktop experiences.

---

## 📋 Clipboard Screenshot Pasting Instructions

### Keyboard Shortcuts
- **Windows / Linux**: `Ctrl + V`
- **macOS**: `Cmd + V`

1. Take a screenshot (e.g. `Win + Shift + S` on Windows, `Cmd + Shift + 4` on macOS, or `PrintScreen` on Linux).
2. Click anywhere on the TextSnap page (outside text inputs) and press the paste shortcut.
3. The image is instantly converted to a local `File` object (automatically named `Pasted Image 1.png`, etc.) and queued for OCR.
4. If you are typing inside a textarea, pressing `Ctrl+V` pastes regular text normally without triggering the image handler.

### Paste Image Button
- Click the **"Paste Image"** button in the upload toolbar.
- The browser will request clipboard read access (supported on secure origins: `https://` or `http://localhost`).
- When granted, the image data is read and placed directly into your processing queue.

---

## 🏗️ Architecture

```
textsnap/
├── public/
│   └── favicon.svg              # Application SVG icon
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Brand header, links, history counter, and theme toggle
│   │   ├── BatchUpload.tsx      # Multi-image dropzone, file picker, and paste controls
│   │   ├── QueueItemCard.tsx    # Queue item thumbnail, status badge, progress, and remove
│   │   ├── BatchProgress.tsx    # Real-time sequential batch progress indicator
│   │   ├── IndividualResult.tsx # Editable text result, metrics, copy, download, and retry
│   │   ├── CombinedResults.tsx  # Compiled document output with headers and exports
│   │   ├── Toast.tsx            # Non-intrusive notifications for clipboard actions
│   │   ├── History.tsx          # Local history modal drawer with restore & delete
│   │   └── ThemeToggle.tsx      # Light/dark/system mode switcher
│   ├── hooks/
│   │   ├── useImageQueue.ts     # Multi-image queue state, validation, and URL cleanup
│   │   ├── useBatchOCR.ts       # Sequential Tesseract.js processing engine
│   │   ├── useClipboardImage.ts # Document paste & navigator.clipboard integration
│   │   ├── useOCR.ts            # Single-image OCR worker wrapper
│   │   └── useHistory.ts        # LocalStorage state management
│   ├── services/
│   │   ├── ocrService.ts        # Tesseract.js worker initialization and text recognition
│   │   ├── clipboardService.ts  # Clipboard DataTransfer extraction and target validation
│   │   ├── imageService.ts      # Canvas-based image enhancement and text stats
│   │   └── storageService.ts    # LocalStorage history and theme persistence
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces & types
│   ├── test/                    # Vitest test suites (40 tests passing)
│   ├── App.tsx                  # Main application orchestration & layout
│   ├── index.css                # Tailwind base & custom animations
│   └── main.tsx                 # React DOM entrypoint
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Batch OCR Lifecycle

```
Add Images (Drop, File Picker, or Ctrl+V / Cmd+V)
       │
       ▼
useImageQueue: Validate MIME type (JPG/PNG/WebP) & File Size (<8MB)
       │
       ▼
Image Queue: [Item 1: Queued, Item 2: Queued, Item 3: Queued]
       │
       ▼
User clicks "Process All" (or "Extract This Image")
       │
       ▼
useBatchOCR: Loops through queue items sequentially
       ├── Sets Item 1: status = 'processing'
       ├── Calls ocrService.recognize(item.file, onProgress)
       │    └── Reuses single Tesseract.js WebAssembly worker
       ├── On Success: status = 'completed', extractedText, confidence
       │    └── Automatically saves to History
       └── On Error: status = 'failed' (continues to Item 2 without crashing)
       │
       ▼
Results Interface:
       ├── Individual Result: View, edit, copy, download, or retry single image
       └── Combined Results: Auto-compiles all completed extractions in queue order
```

---

## 🔒 Privacy & Security

1. **No Backend**: TextSnap has no backend server, no database, no telemetry, and no tracking scripts.
2. **Zero Image Transmission**: Uploaded and pasted images are loaded into browser memory as local Blob object URLs (`blob:http...`). At no point is image data transmitted across the network.
3. **CDN Resource Loading**: On the very first extraction, Tesseract.js fetches its WebAssembly engine (`tesseract-core.wasm`) and the English language model (`eng.traineddata.gz`) from official CDNs. Once downloaded, the browser caches these files locally for instant offline runs.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested on Node.js v22.x)
- pnpm, npm, or yarn

### Installation

1. Clone or navigate into the repository:
   ```bash
   git clone https://github.com/alexoo/textSnap.git
   cd textSnap
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # or
   npm install
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Run all unit and component tests with Vitest:

```bash
pnpm run test
```

Build and verify strict TypeScript compilation:

```bash
pnpm run build
```

---

## 🌐 Free Static Deployment

TextSnap is built as a pure static bundle without any backend requirements. It can be hosted on GitHub Pages, Vercel, Netlify, or Cloudflare Pages for free.

- **Build Command**: `pnpm run build`
- **Output Directory**: `dist`
- **Node Version**: 18+

---

## 📄 License

MIT License. Free to use, modify, and distribute.
