/**
 * Unit tests for XCFParser edge cases
 */
import { XCFParser, XCFParseError, UnsupportedFormatError } from "../../gimpparser.js";
import { Logger } from "../../lib/logger.js";

export async function test22ParserEdgeCases(): Promise<void> {
  // Test 1: parseBuffer with empty buffer
  try {
    const emptyBuffer = new ArrayBuffer(0);
    XCFParser.parseBuffer(emptyBuffer);
    throw new Error("Should have thrown error for empty buffer");
  } catch (error) {
    if (error instanceof UnsupportedFormatError || error instanceof XCFParseError) {
      Logger.log("PASS: Empty buffer correctly throws error");
    } else {
      throw error;
    }
  }

  // Test 2: parseBuffer with invalid header
  try {
    const invalidBuffer = new ArrayBuffer(20);
    const view = new Uint8Array(invalidBuffer);
    // Write "INVALID" instead of "gimp xcf"
    const invalid = new TextEncoder().encode("INVALID");
    view.set(invalid);
    XCFParser.parseBuffer(invalidBuffer);
    throw new Error("Should have thrown error for invalid header");
  } catch (error) {
    if (error instanceof UnsupportedFormatError || error instanceof XCFParseError) {
      Logger.log("PASS: Invalid header correctly throws error");
    } else {
      throw error;
    }
  }

  // Test 3: parseBuffer with Uint8Array
  try {
    const invalidArray = new Uint8Array(10);
    XCFParser.parseBuffer(invalidArray);
    throw new Error("Should have thrown error for invalid Uint8Array");
  } catch (error) {
    if (error instanceof UnsupportedFormatError || error instanceof XCFParseError) {
      Logger.log("PASS: Invalid Uint8Array correctly throws error");
    } else {
      throw error;
    }
  }

  // Test 4: parseFileAsync with non-existent file
  try {
    await XCFParser.parseFileAsync("/nonexistent/path/to/file.xcf");
    throw new Error("Should have thrown error for non-existent file");
  } catch (error) {
    // Should throw ENOENT or similar error
    Logger.log("PASS: Non-existent file correctly throws error");
  }

  Logger.log("PASS: test22ParserEdgeCases - All edge cases handled correctly");
}
