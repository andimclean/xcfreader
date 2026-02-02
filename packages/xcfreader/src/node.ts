/**
 * xcfreader - Node.js entry point
 * 
 * This module exports all Node.js-compatible APIs including XCFPNGImage
 * which depends on Node.js modules (fs, pngjs) for PNG file output.
 * 
 * @module xcfreader/node
 */

// Re-export everything from the main module
export * from "./gimpparser.js";

// Re-export XCFPNGImage for Node.js usage (uses fs, pngjs)
export { XCFPNGImage } from "./lib/xcfpngimage.js";

// Re-export XCFDataImage as well for consistency
export { XCFDataImage, XCFImageData } from "./lib/xcfdataimage.js";

// NOTE: For browser usage, import from 'xcfreader/browser' instead:
//
// ```typescript
// import { XCFParser, XCFDataImage } from 'xcfreader/browser';
// ```
//
// For Node.js usage with PNG file output:
//
// ```typescript
// import { XCFParser, XCFPNGImage } from 'xcfreader/node';
// 
// const parser = await XCFParser.parseFileAsync('image.xcf');
// const image = new XCFPNGImage(parser.width, parser.height);
// parser.createImage(image);
// await image.writeImage('output.png');
// ```
