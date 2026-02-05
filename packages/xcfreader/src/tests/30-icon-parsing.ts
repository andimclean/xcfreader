import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test30IconParsing(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/icon.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Verify it's a 512x512 icon with 4 layers
  if (
    parser.width !== 512 ||
    parser.height !== 512 ||
    parser.layers.length !== 4
  ) {
    throw new Error('Failed to parse icon.xcf correctly');
  }

  Logger.log(
    `PASS: Icon parsing (icon.xcf parsed, ${parser.width}x${parser.height}, ${parser.layers.length} layers)`
  );
}
