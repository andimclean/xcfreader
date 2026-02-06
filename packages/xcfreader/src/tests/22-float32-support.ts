import { XCFParser, XCFPNGImage } from '../node.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test22Float32(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/float32.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  if (!parser) throw new Error('Parser failed');

  // Float32 precision should be FLOAT_LINEAR (600) or FLOAT_GAMMA (650)
  if (parser.precision !== 600 && parser.precision !== 650) {
    throw new Error('Expected precision 600 or 650 (32-bit float), got ' + parser.precision);
  }
  if (parser.bytesPerChannel !== 4) throw new Error('Expected 4 bytes per channel, got ' + parser.bytesPerChannel);
  if (parser.isFloatingPoint !== true) throw new Error('Expected isFloatingPoint true, got ' + parser.isFloatingPoint);
  if (parser.width < 1 || parser.height < 1) throw new Error('Invalid image dimensions');
  if (!parser.layers.length) throw new Error('No layers found');

  // Verify rendering produces non-black pixels (tests float-to-8bit conversion)
  const image = new XCFPNGImage(parser.width, parser.height);
  parser.createImage(image);
  let hasNonBlackPixels = false;
  for (let y = 0; y < parser.height && !hasNonBlackPixels; y++) {
    for (let x = 0; x < parser.width && !hasNonBlackPixels; x++) {
      const pixel = image.getAt(x, y);
      if (pixel.red > 0 || pixel.green > 0 || pixel.blue > 0) {
        hasNonBlackPixels = true;
      }
    }
  }
  if (!hasNonBlackPixels) throw new Error('Rendered image is entirely black');

  Logger.log('PASS: 32-bit float precision XCF parsed and rendered correctly');
}
