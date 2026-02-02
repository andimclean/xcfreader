import {
  XCFParser,
  XCFParseError,
  UnsupportedFormatError
} from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test07ErrorHandling(): Promise<void> {
  // Test missing file
  try {
    await XCFParser.parseFileAsync('/nonexistent/file.xcf');
    throw new Error('Should have thrown XCFParseError for missing file');
  } catch (err: unknown) {
    if (!(err instanceof XCFParseError)) {
      const name = err instanceof Error ? err.constructor.name : 'unknown';
      throw new Error(`Expected XCFParseError, got ${name}`);
    }
  }

  // Test invalid file (not XCF format)
  const invalidFile = path.resolve(__dirname, '../../examples/Background.png');
  try {
    await XCFParser.parseFileAsync(invalidFile);
    throw new Error('Should have thrown UnsupportedFormatError for PNG file');
  } catch (err: unknown) {
    if (!(err instanceof UnsupportedFormatError)) {
      const name = err instanceof Error ? err.constructor.name : 'unknown';
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Expected UnsupportedFormatError, got ${name}: ${message}`
      );
    }
  }

  Logger.log('PASS: error handling works correctly');
}
