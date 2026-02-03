import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test03ParseMulti(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/multi.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);
  if (parser.layers.length !== 10) {
    throw new Error(`Expected 10 layers, got ${parser.layers.length}`);
  }
  Logger.log(`PASS: parsed multi.xcf layers= ${parser.layers.length}`);
}
