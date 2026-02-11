/**
 * XCF PNG Image class for rendering and exporting parsed XCF layers
 * @module xcfreader/lib/xcfpngimage
 */

import FS from "fs";
import { Buffer } from "buffer";
import { PNG } from "pngjs";
import { ColorRGBA, IXCFImage } from "../types/index.js";

/**
 * PNG-based XCF Image wrapper around pngjs for rendering and exporting.
 * Implements IXCFImage interface for pixel manipulation.
 *
 * @example
 * ```typescript
 * // Create an image and set pixels
 * const image = new XCFPNGImage(100, 100);
 * image.setAt(0, 0, { red: 255, green: 0, blue: 0, alpha: 255 });
 * await image.writeImage("output.png");
 * ```
 */
export class XCFPNGImage implements IXCFImage {
  private _width: number;
  private _height: number;
  private _image: PNG;

  /**
   * Create a new XCF image
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   */
  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    const png = new PNG({ width, height });
    // initialize transparent pixels
    png.data = Buffer.alloc(width * height * 4, 0);
    this._image = png;
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
    const buf: Buffer = this._image.data;
    buf[idx] = colour.red;
    buf[idx + 1] = colour.green;
    buf[idx + 2] = colour.blue;
    buf[idx + 3] = colour.alpha ?? 255;
  }

  /**
   * Set a pixel color at the specified coordinates without bounds checking.
   * This is a performance optimization for hot paths where coordinates are guaranteed valid.
   * @param x - X coordinate (must be valid, no bounds check)
   * @param y - Y coordinate (must be valid, no bounds check)
   * @param colour - Color to set (with RGBA values)
   */
  setAtUnchecked(x: number, y: number, colour: ColorRGBA): void {
    const idx = (y * this._width + x) * 4;
    const buf: Buffer = this._image.data;
    buf[idx] = colour.red;
    buf[idx + 1] = colour.green;
    buf[idx + 2] = colour.blue;
    buf[idx + 3] = colour.alpha ?? 255;
  }

  /**
   * Get the color of a pixel at the specified coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Color at the given coordinates
   */
  getAt(x: number, y: number): ColorRGBA {
    const idx = (y * this._width + x) * 4;
    const buf: Buffer = this._image.data;
    return {
      red: buf[idx]!,
      green: buf[idx + 1]!,
      blue: buf[idx + 2]!,
      alpha: buf[idx + 3]!,
    };
  }

  /**
   * Read pixel directly into provided buffer (performance optimization).
   * Avoids object allocation by writing values directly to reusable buffer.
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param outBuffer - Output buffer [r, g, b, a] (must have length >= 4)
   */
  getAtDirect(x: number, y: number, outBuffer: Uint8ClampedArray): void {
    const idx = (y * this._width + x) * 4;
    const buf: Buffer = this._image.data;
    outBuffer[0] = buf[idx]!;
    outBuffer[1] = buf[idx + 1]!;
    outBuffer[2] = buf[idx + 2]!;
    outBuffer[3] = buf[idx + 3]!;
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
   * Write the image to a PNG file
   * @param filename - Path where to save the PNG file
   * @returns Promise that resolves when the file is written
   */
  writeImage(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = this._image.pack().pipe(FS.createWriteStream(filename));
      stream.on("finish", () => resolve());
      stream.on("error", (err: Error) => reject(err));
    });
  }

  /**
   * Get the raw RGBA pixel data as a Uint8Array.
   *
   * This is useful for browser environments where you want to draw the image
   * to a canvas using ImageData.
   *
   * @returns Uint8Array of RGBA pixel data (4 bytes per pixel)
   *
   * @example
   * ```typescript
   * // Browser: draw to canvas
   * const parser = XCFParser.parseBuffer(arrayBuffer);
   * const image = parser.createImage();
   * const pixels = image.getPixelData();
   *
   * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
   * const ctx = canvas.getContext('2d')!;
   * canvas.width = image.width;
   * canvas.height = image.height;
   * const imageData = new ImageData(new Uint8ClampedArray(pixels), image.width, image.height);
   * ctx.putImageData(imageData, 0, 0);
   * ```
   */
  getPixelData(): Uint8Array {
    return new Uint8Array(this._image.data);
  }

  /**
   * Get the underlying mutable RGBA buffer for direct pixel manipulation.
   * Returns the actual pngjs data buffer for performance-critical operations.
   * @returns The mutable Buffer containing RGBA pixel data
   */
  getDataBuffer(): Uint8Array {
    return this._image.data;
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

export default XCFPNGImage;
