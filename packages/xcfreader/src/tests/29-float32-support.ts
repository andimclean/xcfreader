import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test29Float32Support(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/float32.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Verify it's a float32 XCF (v012, 32-bit float precision)
  if (
    parser.width !== 100 ||
    parser.height !== 100 ||
    parser.layers.length !== 4 ||
    !parser.isV11 ||
    !parser.isFloatingPoint
  ) {
    throw new Error('Failed to parse float32.xcf correctly');
  }

  Logger.log(
    `PASS: Float32 support (float32.xcf v0${(parser as any)._version} parsed, ${parser.width}x${parser.height}, ${parser.layers.length} layers, floating point: ${parser.isFloatingPoint})`
  );
}
