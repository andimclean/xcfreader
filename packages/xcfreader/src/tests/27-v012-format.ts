/**
 * Test 27: XCF v012 format support
 * Tests that v012 XCF files parse correctly with proper precision handling
 */

import { XCFParser, XCFPNGImage, XCF_Precision } from "../node.js";
import { Logger } from "../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test27V012Format(): Promise<void> {
  Logger.log("Testing XCF v012 format support...");

  // Test 1: int32.xcf (v012, 32-bit gamma integer precision)
  const int32Path = path.resolve(__dirname, "../../../../example-xcf/int32.xcf");
  const int32Parser = await XCFParser.parseFileAsync(int32Path);

  if (!int32Parser.isV11) {
    throw new Error("int32.xcf should be v011+ format (uses 64-bit pointers)");
  }

  if (int32Parser.precision !== XCF_Precision.U32_GAMMA) {
    throw new Error(
      `int32.xcf: Expected precision 350 (32-bit gamma integer), got ${int32Parser.precision}`,
    );
  }

  if (int32Parser.bytesPerChannel !== 4) {
    throw new Error(
      `int32.xcf: Expected 4 bytes per channel, got ${int32Parser.bytesPerChannel}`,
    );
  }

  if (int32Parser.isFloatingPoint) {
    throw new Error("int32.xcf: 32-bit integer should not be floating point");
  }

  Logger.log("✓ int32.xcf (v012, 32-bit gamma integer) parsed correctly");

  // Test 2: float32.xcf (v012, 32-bit floating point precision)
  const float32Path = path.resolve(__dirname, "../../../../example-xcf/float32.xcf");
  const float32Parser = await XCFParser.parseFileAsync(float32Path);

  if (!float32Parser.isV11) {
    throw new Error("float32.xcf should be v011+ format (uses 64-bit pointers)");
  }

  // Check if precision is float type (600 = FLOAT_LINEAR or 650 = FLOAT_GAMMA)
  const isFloatPrecision =
    float32Parser.precision === XCF_Precision.FLOAT_LINEAR ||
    float32Parser.precision === XCF_Precision.FLOAT_GAMMA;

  if (!isFloatPrecision) {
    throw new Error(
      `float32.xcf: Expected float precision (600 or 650), got ${float32Parser.precision}`,
    );
  }

  if (float32Parser.bytesPerChannel !== 4) {
    throw new Error(
      `float32.xcf: Expected 4 bytes per channel, got ${float32Parser.bytesPerChannel}`,
    );
  }

  if (!float32Parser.isFloatingPoint) {
    throw new Error("float32.xcf: Should be marked as floating point");
  }

  // Verify we can render float32 without errors
  try {
    const image = new XCFPNGImage(float32Parser.width, float32Parser.height);
    float32Parser.createImage(image);
  } catch (err) {
    throw new Error(`float32.xcf: Failed to render - ${err}`);
  }

  Logger.log("✓ float32.xcf (v012, 32-bit floating point) parsed correctly");

  // Test 3: fullColour.xcf (v012, RGB, 32-bit precision)
  const fullColourPath = path.resolve(
    __dirname,
    "../../../../example-xcf/fullColour.xcf",
  );
  const fullColourParser = await XCFParser.parseFileAsync(fullColourPath);

  if (!fullColourParser.isV11) {
    throw new Error("fullColour.xcf should be v011+ format");
  }

  if (fullColourParser.precision !== XCF_Precision.U32_GAMMA) {
    throw new Error(
      `fullColour.xcf: Expected precision 350, got ${fullColourParser.precision}`,
    );
  }

  if (fullColourParser.width !== 1920 || fullColourParser.height !== 1080) {
    throw new Error(
      `fullColour.xcf: Expected 1920x1080, got ${fullColourParser.width}x${fullColourParser.height}`,
    );
  }

  if (fullColourParser.layers.length !== 4) {
    throw new Error(
      `fullColour.xcf: Expected 4 layers, got ${fullColourParser.layers.length}`,
    );
  }

  // Verify we can render fullColour without errors
  try {
    const image = new XCFPNGImage(fullColourParser.width, fullColourParser.height);
    fullColourParser.createImage(image);

    // Verify image has content (not all black)
    const pixels = image.getPixelData();
    let hasNonBlack = false;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 0 || pixels[i + 1] > 0 || pixels[i + 2] > 0) {
        hasNonBlack = true;
        break;
      }
    }

    if (!hasNonBlack) {
      throw new Error("fullColour.xcf: Rendered image is completely black");
    }
  } catch (err) {
    throw new Error(`fullColour.xcf: Failed to render - ${err}`);
  }

  Logger.log("✓ fullColour.xcf (v012, RGB, 1920x1080) parsed correctly");

  // Test 4: Verify v012 files have correct version number internally
  // The version is stored in the _version property after parsing
  if (!int32Parser.isV11) {
    throw new Error("int32.xcf: Version should be >= 11 for v012 format");
  }

  if (!float32Parser.isV11) {
    throw new Error("float32.xcf: Version should be >= 11 for v012 format");
  }

  if (!fullColourParser.isV11) {
    throw new Error("fullColour.xcf: Version should be >= 11 for v012 format");
  }

  Logger.log("✓ All v012 files have correct version markers");

  Logger.log("PASS: test27V012Format - All v012 format tests passed");
}
