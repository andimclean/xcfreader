import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test06ParseEmpty(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/empty.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);
  if (parser.layers.length < 1) {
    throw new Error('Expected at least 1 layer in empty.xcf');
  }
  Logger.log(`PASS: parsed empty.xcf layers= ${parser.layers.length}`);
}
