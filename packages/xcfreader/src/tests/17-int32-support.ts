import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test17Int32(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/int32.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  if (!parser) throw new Error('Parser failed');
  if (parser.precision !== 350) throw new Error('Expected precision 350 (32-bit gamma int), got ' + parser.precision);
  if (parser.bytesPerChannel !== 4) throw new Error('Expected 4 bytes per channel, got ' + parser.bytesPerChannel);
  if (parser.isFloatingPoint !== false) throw new Error('Expected isFloatingPoint false, got ' + parser.isFloatingPoint);
  if (parser.width < 1 || parser.height < 1) throw new Error('Invalid image dimensions');
  if (!parser.layers.length) throw new Error('No layers found');

  Logger.log('PASS: 32-bit int precision XCF parsed correctly');
}
