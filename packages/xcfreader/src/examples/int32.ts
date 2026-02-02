import { Logger } from '../lib/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XCFParser, XCFPNGImage } from '../node.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const xcfPath = path.resolve(__dirname, '../../examples/int32.xcf');
  const outDir = path.resolve(__dirname, '../../../../output/int32');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const parser = await XCFParser.parseFileAsync(xcfPath);

  Logger.log('Image type: ' + (parser.baseType === 0 ? 'RGB' : parser.baseType === 1 ? 'Grayscale' : 'Indexed'));
  Logger.log('Dimensions: ' + parser.width + 'x' + parser.height);
  Logger.log('XCF Version: ' + (parser.isV11 ? 'v011 (64-bit)' : 'v010 (32-bit)'));
  Logger.log('Precision: ' + parser.precision);
  Logger.log('Bytes per channel: ' + parser.bytesPerChannel);
  Logger.log('Layers: ' + parser.layers.length);

  const image = new XCFPNGImage(parser.width, parser.height);
  parser.createImage(image);
  await image.writeImage(path.resolve(outDir, 'output.png'));
  Logger.log('Image saved to ' + path.resolve(outDir, 'output.png'));
}

main().catch((err) => {
  Logger.error(err);
  process.exit(1);
});
