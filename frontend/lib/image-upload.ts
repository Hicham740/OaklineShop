/**
 * Client-side image optimisation for product uploads.
 *
 * The admin panel has no file server yet, so uploaded images are resized and
 * compressed in the browser and saved as a data URL with the product. This
 * keeps them small enough for localStorage and makes the storefront fast.
 *
 * When the backend is connected, send the original `File` to the API instead
 * and keep the same size limits on the server.
 */

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1000;
const TARGET_BYTES = 180 * 1024;
const MIN_DIMENSION = 320;

export interface OptimisedImage {
  /** A compressed data URL that can be used directly in an <img> tag. */
  dataUrl: string;
  width: number;
  height: number;
  /** Size of the optimised image in bytes. */
  bytes: number;
  /** Size of the file the admin selected, in bytes. */
  originalBytes: number;
}

/** Human-readable file size, e.g. "124 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      };
    } catch {
      // Some formats (for example SVG in older browsers) are not supported
      // by createImageBitmap. Fall through to the <img> decoder.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("This image could not be opened."));
      element.src = url;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function drawToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not process this image.");
  }

  // Flatten transparency onto white so JPEG fallbacks look right.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, width, height);

  return canvas;
}

function encode(canvas: HTMLCanvasElement): { dataUrl: string; bytes: number } {
  // WebP is smaller and keeps transparency. Browsers that do not support it
  // silently return a PNG, so fall back to JPEG in that case.
  let dataUrl = canvas.toDataURL("image/webp", 0.82);
  if (!dataUrl.startsWith("data:image/webp")) {
    dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  }
  return { dataUrl, bytes: dataUrlBytes(dataUrl) };
}

/**
 * Resize an uploaded image to fit 1000 × 1000 and compress it until it is
 * around 180 KB. Returns the optimised data URL plus its dimensions.
 */
export async function optimiseImage(file: File): Promise<OptimisedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPG, PNG, WebP or AVIF).");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `This image is ${formatFileSize(file.size)}. Please choose a file under 8 MB.`,
    );
  }

  const decoded = await decodeImage(file);

  try {
    if (!decoded.width || !decoded.height) {
      throw new Error("This image has no readable dimensions.");
    }

    const initialScale = Math.min(
      1,
      MAX_DIMENSION / Math.max(decoded.width, decoded.height),
    );
    let width = Math.max(1, Math.round(decoded.width * initialScale));
    let height = Math.max(1, Math.round(decoded.height * initialScale));
    let quality = 0.82;

    let output = encode(drawToCanvas(decoded.source, width, height));

    // Most photos fit after the first resize. If not, lower the quality first
    // and only then shrink the dimensions further.
    let attempts = 0;
    while (output.bytes > TARGET_BYTES && attempts < 6) {
      attempts += 1;

      if (quality > 0.6) {
        quality = Math.max(0.6, quality - 0.12);
        const canvas = drawToCanvas(decoded.source, width, height);
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        output = { dataUrl, bytes: dataUrlBytes(dataUrl) };
      } else {
        const nextWidth = Math.round(width * 0.8);
        const nextHeight = Math.round(height * 0.8);
        if (nextWidth < MIN_DIMENSION || nextHeight < MIN_DIMENSION) break;
        width = nextWidth;
        height = nextHeight;
        output = encode(drawToCanvas(decoded.source, width, height));
      }

      if (width <= MIN_DIMENSION && height <= MIN_DIMENSION) break;
    }

    return {
      dataUrl: output.dataUrl,
      width,
      height,
      bytes: output.bytes,
      originalBytes: file.size,
    };
  } finally {
    decoded.dispose();
  }
}
