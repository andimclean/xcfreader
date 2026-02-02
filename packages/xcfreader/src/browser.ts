/**
 * xcfreader - Browser entry point
 * 
 * This module exports all browser-compatible APIs.
 * XCFPNGImage is excluded as it depends on Node.js modules (fs, pngjs).
 * Use XCFDataImage instead for browser-based rendering.
 * 
 * @module xcfreader/browser
 */

// Re-export all types
export * from "./types/index.js";

// Re-export XCFDataImage for browser usage (uses ImageData)
export { XCFDataImage, XCFImageData } from "./lib/xcfdataimage.js";

// Re-export parser and error classes
export { XCFParser, XCFParseError, UnsupportedFormatError } from "./gimpparser.js";

// NOTE: XCFPNGImage is NOT exported here because it requires Node.js modules:
// - fs (for file system operations)
// - pngjs (for PNG encoding)
// 
// For browser usage, use XCFDataImage instead:
//
// ```typescript
// import { XCFParser, XCFDataImage } from 'xcfreader/browser';
// 
// const parser = XCFParser.parseBuffer(arrayBuffer);
// const image = new XCFDataImage(parser.width, parser.height);
// parser.createImage(image);
// 
// const ctx = canvas.getContext('2d');
// ctx.putImageData(image.imageData as ImageData, 0, 0);
// ```
