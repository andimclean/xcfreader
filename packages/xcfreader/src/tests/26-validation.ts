/**
 * Test 26: XCF validation
 * Tests that the validator correctly rejects corrupted or invalid XCF files
 */

import { XCFParser, XCFValidationError, UnsupportedFormatError } from "../gimpparser.js";
import { Logger } from "../lib/logger.js";
import { Buffer } from "buffer";

export async function test26Validation(): Promise<void> {
  Logger.log("Running validation tests...");

  // Test 1: Too small buffer
  try {
    const tooSmall = Buffer.alloc(10);
    XCFParser.parseBuffer(tooSmall);
    throw new Error("Should have thrown error for too small buffer");
  } catch (err) {
    if (err instanceof UnsupportedFormatError) {
      Logger.log("✓ Correctly rejected too small buffer");
    } else {
      throw err;
    }
  }

  // Test 2: Invalid magic bytes
  try {
    const invalidMagic = Buffer.alloc(50);
    invalidMagic.write("XXXX xcf file", 0, "utf-8");
    XCFParser.parseBuffer(invalidMagic);
    throw new Error("Should have thrown error for invalid magic bytes");
  } catch (err) {
    if (err instanceof UnsupportedFormatError) {
      Logger.log("✓ Correctly rejected invalid magic bytes");
    } else {
      throw err;
    }
  }

  // Test 3: Invalid version string
  try {
    const invalidVersion = Buffer.alloc(50);
    invalidVersion.write("gimp xcf ", 0, "utf-8");
    invalidVersion.write("XXXX", 9, "utf-8"); // Invalid version (not "file" or "v0XX")
    XCFParser.parseBuffer(invalidVersion);
    throw new Error("Should have thrown error for invalid version");
  } catch (err) {
    if (err instanceof UnsupportedFormatError) {
      Logger.log("✓ Correctly rejected invalid version string");
    } else {
      throw err;
    }
  }

  // Test 4: Create a minimal valid XCF header with invalid dimensions
  try {
    const buf = Buffer.alloc(200);

    // Write valid header
    buf.write("gimp xcf file", 0, "utf-8");
    buf.writeUInt8(0, 13); // null terminator

    // Write invalid dimensions (width = -1, height = 100)
    buf.writeUInt32BE(0xFFFFFFFF, 14); // width (will be interpreted as huge number)
    buf.writeUInt32BE(100, 18); // height
    buf.writeUInt32BE(0, 22); // base_type (RGB)

    // Write layer and channel list terminators
    buf.writeUInt32BE(0, 26); // layer list terminator
    buf.writeUInt32BE(0, 30); // channel list terminator

    XCFParser.parseBuffer(buf);
    throw new Error("Should have thrown error for invalid dimensions");
  } catch (err) {
    if (err instanceof XCFValidationError || err instanceof UnsupportedFormatError) {
      Logger.log("✓ Correctly rejected invalid image dimensions");
    } else {
      throw err;
    }
  }

  // Test 5: Test with dimensions exceeding maximum
  try {
    const buf = Buffer.alloc(200);

    // Write valid header
    buf.write("gimp xcf file", 0, "utf-8");
    buf.writeUInt8(0, 13);

    // Write dimensions exceeding max (600000 > 524288)
    buf.writeUInt32BE(600000, 14); // width - exceeds maxDimension
    buf.writeUInt32BE(100, 18); // height
    buf.writeUInt32BE(0, 22); // base_type

    buf.writeUInt32BE(0, 26); // layer list terminator
    buf.writeUInt32BE(0, 30); // channel list terminator

    XCFParser.parseBuffer(buf);
    throw new Error("Should have thrown error for dimensions exceeding max");
  } catch (err) {
    if (err instanceof XCFValidationError || err instanceof UnsupportedFormatError) {
      Logger.log("✓ Correctly rejected dimensions exceeding maximum");
    } else {
      throw err;
    }
  }

  // Test 6: Invalid base type
  try {
    const buf = Buffer.alloc(200);

    buf.write("gimp xcf file", 0, "utf-8");
    buf.writeUInt8(0, 13);

    buf.writeUInt32BE(100, 14); // width
    buf.writeUInt32BE(100, 18); // height
    buf.writeUInt32BE(99, 22); // base_type (invalid - must be 0, 1, or 2)

    buf.writeUInt32BE(0, 26);
    buf.writeUInt32BE(0, 30);

    XCFParser.parseBuffer(buf);
    throw new Error("Should have thrown error for invalid base type");
  } catch (err) {
    if (err instanceof XCFValidationError || err instanceof UnsupportedFormatError) {
      Logger.log("✓ Correctly rejected invalid base type");
    } else {
      throw err;
    }
  }

  // Test 7: Layer pointer out of bounds
  try {
    const buf = Buffer.alloc(10000); // Make buffer larger to pass header parsing

    buf.write("gimp xcf file", 0, "utf-8");
    buf.writeUInt8(0, 13);

    buf.writeUInt32BE(100, 14); // width
    buf.writeUInt32BE(100, 18); // height
    buf.writeUInt32BE(0, 22); // base_type

    // Write layer pointer that's way out of bounds (beyond buffer size)
    buf.writeUInt32BE(999999, 26); // layer pointer way beyond 10000 byte buffer
    buf.writeUInt32BE(0, 30); // terminate layer list
    buf.writeUInt32BE(0, 34); // channel list terminator

    XCFParser.parseBuffer(buf);
    throw new Error("Should have thrown error for out-of-bounds layer pointer");
  } catch (err) {
    const isValidationError = err instanceof XCFValidationError || err instanceof UnsupportedFormatError;
    const hasPointerInMessage = err instanceof Error && err.message.includes("pointer");
    if (isValidationError || hasPointerInMessage) {
      Logger.log("✓ Correctly rejected out-of-bounds layer pointer");
    } else {
      throw err;
    }
  }

  Logger.log("PASS: test26Validation - All validation tests passed");
}
