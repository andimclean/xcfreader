import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test33LargeImage(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/192608-nhl-marlow.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Verify it's a large image (2480x3507)
  if (
    parser.width !== 2480 ||
    parser.height !== 3507 ||
    parser.layers.length < 1
  ) {
    throw new Error('Failed to parse 192608-nhl-marlow.xcf correctly');
  }

  Logger.log(
    `PASS: Large image support (192608-nhl-marlow.xcf parsed, ${parser.width}x${parser.height})`
  );
}
