/**
 * Unit tests for precision and bit-depth conversions
 */
import { XCFParser } from "../../gimpparser.js";
import { Logger } from "../../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test23PrecisionConversion(): Promise<void> {
  // Test with high bit-depth file (32-bit)
  const int32Path = path.resolve(__dirname, "../../../../../example-xcf/int32.xcf");
  const parser = await XCFParser.parseFileAsync(int32Path);

  // Verify precision properties
  if (!parser.precision) {
    throw new Error("Precision should be defined for int32.xcf");
  }

  Logger.log(`Precision: ${parser.precision}`);
  Logger.log(`Bytes per channel: ${parser.bytesPerChannel}`);
  Logger.log(`Is floating point: ${parser.isFloatingPoint}`);

  // Verify bytesPerChannel calculation
  const expectedBytes = parser.isFloatingPoint ? 4 : Math.pow(2, Math.floor(Math.log2(parser.precision / 100)));
  if (parser.bytesPerChannel !== expectedBytes && parser.bytesPerChannel !== 4) {
    throw new Error(`Expected bytesPerChannel to match precision, got ${parser.bytesPerChannel}`);
  }

  // Test that parser handles the precision correctly
  if (parser.layers.length === 0) {
    throw new Error("Expected at least one layer in int32.xcf");
  }

  Logger.log("PASS: test23PrecisionConversion - Precision properties correct");
}
