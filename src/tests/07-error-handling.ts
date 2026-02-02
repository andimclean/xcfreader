import {
  XCFParser,
  XCFParseError,
  UnsupportedFormatError
} from '../gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';
import FS from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test07ErrorHandling(): Promise<void> {
  // Test missing file
  try {
    await XCFParser.parseFileAsync('/nonexistent/file.xcf');
    throw new Error('Should have thrown XCFParseError for missing file');
  } catch (err: any) {
    if (!(err instanceof XCFParseError)) {
      throw new Error(`Expected XCFParseError, got ${err.constructor.name}`);
    }
  }

  // Test invalid file (not XCF format)
  const invalidFile = path.resolve(__dirname, '../../examples/Background.png');
  try {
    await XCFParser.parseFileAsync(invalidFile);
    throw new Error('Should have thrown UnsupportedFormatError for PNG file');
  } catch (err: any) {
    if (!(err instanceof UnsupportedFormatError)) {
      throw new Error(
        `Expected UnsupportedFormatError, got ${err.constructor.name}: ${err.message}`
      );
    }
  }

  console.log('PASS: error handling works correctly');
}
