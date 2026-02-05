import { XCFParser, XCF_BaseType } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test31PipeIndexed(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/pipe.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Verify it's an indexed color image
  if (
    parser.width !== 256 ||
    parser.height !== 256 ||
    parser.layers.length !== 1 ||
    parser.baseType !== XCF_BaseType.INDEXED ||
    !parser.colormap
  ) {
    throw new Error('Failed to parse pipe.xcf as indexed color');
  }

  Logger.log(
    `PASS: Indexed pipe image (pipe.xcf parsed, ${parser.width}x${parser.height}, indexed with ${parser.colormap!.length} colors)`
  );
}
