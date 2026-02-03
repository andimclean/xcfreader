import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test05TextParasites(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/text.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  let hasParasites = false;
  for (const layer of parser.layers) {
    if (Object.keys(layer.parasites).length > 0) {
      hasParasites = true;
      break;
    }
  }

  if (!hasParasites) {
    throw new Error('No parasites found in text.xcf');
  }
  Logger.log(`PASS: text.xcf parasites found= ${hasParasites}`);
}
