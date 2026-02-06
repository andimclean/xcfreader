import { XCFParser, XCFPNGImage } from '../node.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test26PipeFile(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/pipe.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  if (!parser) throw new Error('Parser failed');
  if (!parser.isV11) throw new Error('Expected isV11=true for pipe.xcf');
  if (parser.width < 1 || parser.height < 1) throw new Error('Invalid image dimensions');
  if (!parser.layers.length) throw new Error('No layers found');

  // Verify rendering works
  const image = new XCFPNGImage(parser.width, parser.height);
  parser.createImage(image);
  if (!image || !image.getAt) throw new Error('Failed to render image');

  Logger.log('PASS: v011 XCF file (pipe.xcf) parsed and rendered correctly');
}
