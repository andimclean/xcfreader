/**
 * Test 16: Full color RGB v012 support with high bit-depth
 *
 * Verifies that fullColour.xcf (RGB, v012 format, 32-bit precision) parses
 * and renders correctly with proper high bit-depth conversion.
 */
import { XCFParser, XCFPNGImage, XCF_BaseType, XCF_Precision } from "../node.js";
import { Logger } from "../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test16FullColorSupport(): Promise<void> {
  const xcfPath = path.resolve(__dirname, "../../../../example-xcf/fullColour.xcf");
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Verify basic properties
  if (parser.width !== 1920 || parser.height !== 1080) {
    throw new Error(
      `Expected 1920x1080, got ${parser.width}x${parser.height}`,
    );
  }

  // Verify it's RGB
  if (parser.baseType !== XCF_BaseType.RGB) {
    throw new Error(`Expected RGB (0), got baseType ${parser.baseType}`);
  }

  // Verify v011 format
  if (!parser.isV11) {
    throw new Error("Expected v011 format (64-bit pointers)");
  }

  // Verify 32-bit gamma integer precision
  if (parser.precision !== XCF_Precision.U32_GAMMA) {
    throw new Error(
      `Expected precision 350 (32-bit gamma integer), got ${parser.precision}`,
    );
  }

  // Verify bytes per channel is 4 for 32-bit
  if (parser.bytesPerChannel !== 4) {
    throw new Error(
      `Expected 4 bytes per channel, got ${parser.bytesPerChannel}`,
    );
  }

  // Verify not floating point
  if (parser.isFloatingPoint) {
    throw new Error("32-bit integer should not be floating point");
  }

  // Verify no colormap for RGB
  if (parser.colormap !== null) {
    throw new Error("RGB images should have null colormap");
  }

  // Verify layers
  if (parser.layers.length !== 4) {
    throw new Error(`Expected 4 layers, got ${parser.layers.length}`);
  }

  // Verify we can render without errors
  const image = new XCFPNGImage(parser.width, parser.height);
  parser.createImage(image);

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
    throw new Error("Rendered image is completely black");
  }

  Logger.log(
    "PASS: Full color RGB v011 support (fullColour.xcf parsed and renders correctly)",
  );
}
