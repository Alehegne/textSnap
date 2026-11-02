# TextSnap 📸 ➡️ 📝

**TextSnap** is a modern, responsive, 100% client-side Optical Character Recognition (OCR) web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Tesseract.js**.

Extract English text from receipts, documents, book pages, screenshots, and invoices directly in your web browser — **with zero server uploads, complete privacy, and no accounts or API keys required**.

![TextSnap Screenshot Placeholder](public/favicon.svg)

---

## ✨ Features

- 🔒 **100% Client-Side Privacy**: All OCR processing executes entirely inside your browser using Tesseract.js (WebAssembly). Uploaded images are **never** transmitted to any server.
- ⚡ **Drag & Drop Uploads**: Support for **JPG**, **PNG**, and **WebP** formats with file validation up to 8 MB.
- 🖼️ **Safe Image Previews & Cleanup**: Uses standard Browser File and Object URL APIs with automatic memory cleanup to avoid leaks.
- 🛠️ **Live Image Preprocessing**:
  - Optional grayscale conversion
  - Dynamic contrast enhancement slider (-50 to +100)
  - High-contrast black & white binarization
  - Color inversion (ideal for light text on dark backgrounds)
  - Instant before/after comparison preview
- 📊 **Real-time Recognition Progress**: Live progress percentage and status indicators straight from the Tesseract worker thread.
- 📝 **Interactive Text Editor**:
  - In-place editable textarea preserving recognized line breaks
  - Live character count, word count, and line count
  - OCR recognition confidence rating
- 📋 **One-Click Export**:
  - Instant clipboard copy with automatic fallback support
  - Download as formatted `.txt` file using native Blobs
- 🕰️ **Local Extraction History**:
  - Automatically saves recent extractions in `localStorage`
  - Restore previous results back into the editor with one click
  - Delete individual records or clear history
  - *Note: Only extracted text and metadata are stored—images are never stored in localStorage.*
- 🌓 **Dark Mode**: Fully styled modern light and dark themes with system preference detection and smooth transitions.
- 📱 **Fully Responsive**: Tailored layout for mobile, tablet, and widescreen desktop experiences.

---

## 🏗️ Architecture

```
textsnap/
├── public/
│   └── favicon.svg           # Application SVG icon
├── src/
│   ├── components/
│   │   ├── Navbar.tsx        # Brand header, links, history counter, and theme toggle
│   │   ├── ImageUploader.tsx # React Dropzone upload area and quick-test demo samples
│   │   ├── ImagePreview.tsx  # Preview viewport, dimension badge, enhancement filters
│   │   ├── ProgressBar.tsx   # Real-time OCR worker progress tracking
│   │   ├── OCRResults.tsx    # Editable text result, word/char counts, copy & download
│   │   ├── History.tsx       # Local history modal drawer with restore & delete
│   │   └── ThemeToggle.tsx   # Light/dark/system mode switcher
│   ├── hooks/
│   │   ├── useOCR.ts         # Tesseract worker lifecycle & recognition state
│   │   ├── useImageUpload.ts # Image selection, validation, and object URL cleanup
│   │   └── useHistory.ts     # LocalStorage state management
│   ├── services/
│   │   ├── ocrService.ts     # Tesseract.js worker initialization and text recognition
│   │   ├── imageService.ts   # Canvas-based image enhancement and text stats
│   │   └── storageService.ts # LocalStorage history and theme persistence
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces & types
│   ├── test/                 # Vitest & React Testing Library test suites
│   ├── App.tsx               # Main application orchestration & layout
│   ├── index.css             # Tailwind base & custom animations
│   └── main.tsx              # React DOM entrypoint
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### How OCR Runs Locally

```
User selects image
       │
       ▼
useImageUpload: Validate MIME type & file size (max 8MB)
       │
       ▼
imageService (optional): Canvas grayscale / contrast enhancement
       │
       ▼
ocrService: Tesseract.js Worker (WebAssembly)
       ├── Loads English language model ('eng') from CDN cache
       ├── Emits real-time progress callbacks to ProgressBar
       └── Returns recognized text + confidence rating
       │
       ▼
OCRResults: Editable textarea + Word/Char counts + Clipboard Copy + TXT Download
       │
       ▼
storageService: Saves text snippet & stats into LocalStorage (no image binaries)
```

---

## 🔒 Privacy & Security

1. **No Backend**: TextSnap has no backend server, no database, no telemetry, and no tracking scripts.
2. **Zero Image Transmission**: Uploaded images are loaded into the browser memory as a local Blob object URL (`blob:http...`). At no point is image data transmitted across the network.
3. **CDN Resource Loading**: On the very first extraction, Tesseract.js fetches its WebAssembly engine (`tesseract-core.wasm`) and the English language model (`eng.traineddata.gz`) from official CDNs. Once downloaded, the browser caches these files locally for faster future runs.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (tested on Node.js v22.x)
- npm, pnpm, or yarn

### Installation

1. Clone or navigate into the repository:
   ```bash
   git clone https://github.com/alexoo/textSnap.git
   cd textSnap
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Run unit and component tests with Vitest:

```bash
npm run test
```

Build and verify strict TypeScript compilation:

```bash
npm run build
```

---

## 🌐 Free Static Deployment

TextSnap is built as a pure static bundle without any backend requirements. It can be hosted on GitHub Pages, Vercel, Netlify, or Cloudflare Pages for free.

### GitHub Pages

1. In `vite.config.ts`, `base: './'` is configured to support relative paths.
2. Build the production output:
   ```bash
   npm run build
   ```
3. Push the `dist/` directory or use the official GitHub Pages Action (`actions/deploy-pages`).

### Vercel / Netlify

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18+

No environment variables or paid API keys are required.

---

## 📄 License

MIT License. Free to use, modify, and distribute.
