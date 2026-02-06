import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test23GameSprites(): Promise<void> {
  const testFiles = ['boardpieces.xcf', 'currentpieces.xcf', 'wallpieces.xcf'];

  for (const fileName of testFiles) {
    const xcfPath = path.resolve(__dirname, '../../../../example-xcf/' + fileName);
    const parser = await XCFParser.parseFileAsync(xcfPath);

    if (!parser) throw new Error(`Parser failed for ${fileName}`);

    // Old format game sprite sheets
    if (parser.isV11) throw new Error(`Expected old format (isV11=false) for ${fileName}, got isV11=true`);
    if (parser.width < 1 || parser.height < 1) throw new Error(`Invalid dimensions for ${fileName}`);
    if (!parser.layers.length) throw new Error(`No layers found in ${fileName}`);

    // Verify Y positions are valid (not NaN or undefined)
    for (const layer of parser.layers) {
      if (typeof layer.y !== 'number' || isNaN(layer.y)) {
        throw new Error(`Invalid Y position in ${fileName} layer "${layer.name}"`);
      }
    }
  }

  Logger.log('PASS: Game sprite XCF files (boardpieces, currentpieces, wallpieces) parsed correctly');
}
