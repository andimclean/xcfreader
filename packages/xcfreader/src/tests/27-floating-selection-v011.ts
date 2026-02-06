import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test27FloatingSelectionV011(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/GroundFloor.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  if (!parser) throw new Error('Parser failed');
  if (!parser.isV11) throw new Error('Expected isV11=true for GroundFloor.xcf');
  if (parser.width < 1 || parser.height < 1) throw new Error('Invalid image dimensions');
  if (!parser.layers.length) throw new Error('No layers found');

  // Regression test: parsing should succeed without assertion errors
  // (Previously failed due to hardcoded 4-byte pointer assertion for FLOATING_SELECTION)

  Logger.log('PASS: v011 XCF with floating selection (GroundFloor.xcf) parsed correctly');
}
