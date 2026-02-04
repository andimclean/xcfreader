import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test01ParseSingle(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/single.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);
  if (
    parser.width !== 524 ||
    parser.height !== 505 ||
    parser.layers.length !== 1
  ) {
    throw new Error('Failed to parse single.xcf correctly');
  }
  Logger.log(
    `PASS: parsed ${path.basename(xcfPath)} width= ${parser.width} layers= ${parser.layers.length}`
  );
}
