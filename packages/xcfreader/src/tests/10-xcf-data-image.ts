import { XCFParser, XCFDataImage } from '../browser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test10XCFDataImage(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../examples/single.xcf');
  
  // Read file as buffer and convert to ArrayBuffer (simulating browser usage)
  const fileBuffer = fs.readFileSync(xcfPath);
  const arrayBuffer = fileBuffer.buffer.slice(
    fileBuffer.byteOffset,
    fileBuffer.byteOffset + fileBuffer.byteLength
  );
  
  // Parse using parseBuffer (browser API)
  const parser = XCFParser.parseBuffer(arrayBuffer);
  
  // Create XCFDataImage and render
  const image = new XCFDataImage(parser.width, parser.height);
  parser.createImage(image);

  // Test basic properties
  if (image.width !== parser.width || image.height !== parser.height) {
    throw new Error(`XCFDataImage dimensions mismatch: expected ${parser.width}x${parser.height}, got ${image.width}x${image.height}`);
  }

  // Test setAt/getAt
  image.setAt(0, 0, { red: 255, green: 128, blue: 64, alpha: 200 });
  const color = image.getAt(0, 0);
  if (color.red !== 255 || color.green !== 128 || color.blue !== 64 || color.alpha !== 200) {
    throw new Error(`XCFDataImage.getAt() returned wrong color: ${JSON.stringify(color)}`);
  }

  // Test fillRect
  image.fillRect(10, 10, 5, 5, { red: 100, green: 100, blue: 100, alpha: 255 });
  const fillColor = image.getAt(12, 12);
  if (fillColor.red !== 100 || fillColor.green !== 100 || fillColor.blue !== 100) {
    throw new Error(`XCFDataImage.fillRect() did not fill correctly: ${JSON.stringify(fillColor)}`);
  }

  // Test getPixelData
  const pixelData = image.getPixelData();
  if (!(pixelData instanceof Uint8Array)) {
    throw new Error('XCFDataImage.getPixelData() did not return Uint8Array');
  }
  if (pixelData.length !== parser.width * parser.height * 4) {
    throw new Error(`XCFDataImage.getPixelData() wrong length: expected ${parser.width * parser.height * 4}, got ${pixelData.length}`);
  }

  // Test imageData getter
  const imageData = image.imageData;
  if (!imageData || !imageData.data || imageData.width !== parser.width || imageData.height !== parser.height) {
    throw new Error('XCFDataImage.imageData getter returned invalid object');
  }

  Logger.log(`PASS: XCFDataImage works correctly (${parser.width}x${parser.height})`);
}
