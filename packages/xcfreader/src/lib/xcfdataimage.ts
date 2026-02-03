/**
 * XCF Data Image class for browser-based rendering using ImageData
 * @module xcfreader/lib/xcfdataimage
 */

import { ColorRGBA, IXCFImage } from "../types/index.js";

/**
 * Minimal ImageData interface for browser compatibility.
 * In browser environments, use the native ImageData class.
 * This interface allows the code to compile in Node.js while being
 * fully compatible with browser ImageData.
 */
export interface XCFImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

/**
 * Browser-based XCF Image wrapper using ImageData for rendering.
 * Implements IXCFImage interface for pixel manipulation.
 *
 * This class is designed for browser environments where you want to
 * render XCF files directly to a canvas without needing Node.js dependencies.
 *
 * @example
 * ```typescript
 * // Create an image and render to canvas
 * const image = new XCFDataImage(100, 100);
 * parser.createImage(image);
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
 * const ctx = canvas.getContext('2d')!;
 * ctx.putImageData(image.imageData, 0, 0);
 * ```
 */
export class XCFDataImage implements IXCFImage {
  private _width: number;
  private _height: number;
  private _data: Uint8ClampedArray;

  /**
   * Create a new XCF data image
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   */
  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    // Initialize with transparent pixels (RGBA = 0,0,0,0)
    this._data = new Uint8ClampedArray(width * height * 4);
  }

  /**
   * Set a pixel color at the specified coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param colour - Color to set (with RGBA values)
   */
  setAt(x: number, y: number, colour: ColorRGBA): void {
    if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
      return;
    }
    const idx = (y * this._width + x) * 4;
    this._data[idx] = colour.red;
    this._data[idx + 1] = colour.green;
    this._data[idx + 2] = colour.blue;
    this._data[idx + 3] = colour.alpha ?? 255;
  }

  /**
   * Get the color of a pixel at the specified coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Color at the given coordinates
   */
  getAt(x: number, y: number): ColorRGBA {
    const idx = (y * this._width + x) * 4;
    return {
      red: this._data[idx],
      green: this._data[idx + 1],
      blue: this._data[idx + 2],
      alpha: this._data[idx + 3],
    };
  }

  /**
   * Fill a rectangle with a color
   * @param x - X coordinate of top-left corner
   * @param y - Y coordinate of top-left corner
   * @param w - Width of rectangle
   * @param h - Height of rectangle
   * @param colour - Color to fill with
   */
  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    colour: ColorRGBA,
  ): void {
    for (let yy = y; yy < y + h; yy += 1) {
      for (let xx = x; xx < x + w; xx += 1) {
        this.setAt(xx, yy, colour);
      }
    }
  }

  /**
   * Get the raw RGBA pixel data as a Uint8Array.
   *
   * This is useful for creating ImageData objects for canvas rendering.
   *
   * @returns Uint8Array of RGBA pixel data (4 bytes per pixel)
   *
   * @example
   * ```typescript
   * const pixels = image.getPixelData();
   * const imageData = new ImageData(new Uint8ClampedArray(pixels), image.width, image.height);
   * ctx.putImageData(imageData, 0, 0);
   * ```
   */
  getPixelData(): Uint8Array {
    return new Uint8Array(this._data);
  }

  /**
   * Get the underlying ImageData object for direct canvas rendering.
   *
   * Note: This creates a new ImageData-compatible object each time it's called.
   * For repeated rendering, consider caching the result or using getPixelData().
   *
   * @returns ImageData-compatible object ready to be used with canvas putImageData()
   *
   * @example
   * ```typescript
   * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
   * const ctx = canvas.getContext('2d')!;
   * canvas.width = image.width;
   * canvas.height = image.height;
   * ctx.putImageData(image.imageData as ImageData, 0, 0);
   * ```
   */
  get imageData(): XCFImageData {
    return {
      data: this._data,
      width: this._width,
      height: this._height,
    };
  }

  /**
   * Convert the image to a PNG Blob for download or upload.
   *
   * This method uses the Canvas API to encode the image as PNG.
   * Only available in browser environments with Canvas support.
   *
   * @param mimeType - The MIME type for the blob (default: 'image/png')
   * @param quality - Quality for lossy formats like 'image/jpeg' (0-1, default: 0.92)
   * @returns Promise that resolves to a Blob containing the encoded image
   *
   * @example
   * ```typescript
   * // Download as PNG
   * const blob = await image.toBlob();
   * const url = URL.createObjectURL(blob);
   * const a = document.createElement('a');
   * a.href = url;
   * a.download = 'image.png';
   * a.click();
   * URL.revokeObjectURL(url);
   * ```
   *
   * @example
   * ```typescript
   * // Upload to server
   * const blob = await image.toBlob('image/jpeg', 0.8);
   * const formData = new FormData();
   * formData.append('image', blob, 'image.jpg');
   * await fetch('/upload', { method: 'POST', body: formData });
   * ```
   */
  toBlob(mimeType: string = "image/png", quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment with Canvas support
      // Use globalThis to access browser globals without TypeScript DOM lib
      const g = globalThis as Record<string, unknown>;
      if (typeof g.document === "undefined" || typeof g.HTMLCanvasElement === "undefined") {
        reject(new Error("toBlob() requires a browser environment with Canvas support"));
        return;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = g.document as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canvas = doc.createElement("canvas") as any;
        canvas.width = this._width;
        canvas.height = this._height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        // Create ImageData and put it on the canvas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ImageDataCtor = g.ImageData as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageData = new ImageDataCtor(this._data, this._width, this._height) as any;
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob
        canvas.toBlob(
          (blob: unknown) => {
            if (blob) {
              resolve(blob as Blob);
            } else {
              reject(new Error("Failed to create blob from canvas"));
            }
          },
          mimeType,
          quality
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Convert the image to a data URL for embedding in HTML or CSS.
   *
   * This method uses the Canvas API to encode the image.
   * Only available in browser environments with Canvas support.
   *
   * @param mimeType - The MIME type for the data URL (default: 'image/png')
   * @param quality - Quality for lossy formats like 'image/jpeg' (0-1, default: 0.92)
   * @returns The data URL string (e.g., 'data:image/png;base64,...')
   *
   * @example
   * ```typescript
   * const dataUrl = image.toDataURL();
   * const img = document.createElement('img');
   * img.src = dataUrl;
   * document.body.appendChild(img);
   * ```
   */
  toDataURL(mimeType: string = "image/png", quality?: number): string {
    // Check if we're in a browser environment with Canvas support
    // Use globalThis to access browser globals without TypeScript DOM lib
    const g = globalThis as Record<string, unknown>;
    if (typeof g.document === "undefined" || typeof g.HTMLCanvasElement === "undefined") {
      throw new Error("toDataURL() requires a browser environment with Canvas support");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = g.document as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = doc.createElement("canvas") as any;
    canvas.width = this._width;
    canvas.height = this._height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get 2D canvas context");
    }

    // Create ImageData and put it on the canvas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ImageDataCtor = g.ImageData as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageData = new ImageDataCtor(this._data, this._width, this._height) as any;
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL(mimeType, quality) as string;
  }

  /**
   * Get the image width in pixels
   */
  get width(): number {
    return this._width;
  }

  /**
   * Get the image height in pixels
   */
  get height(): number {
    return this._height;
  }
}

export default XCFDataImage;
