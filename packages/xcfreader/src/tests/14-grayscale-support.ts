/**
 * Test grayscale image support using grey.xcf (XCF v011 format)
 */
import { Logger } from "../lib/logger.js";
import { XCFParser, XCFPNGImage, XCF_BaseType } from "../node.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test14GrayscaleSupport(): Promise<void> {
  // Test 1: Verify XCF_BaseType enum values
  if (XCF_BaseType.RGB !== 0) {
    throw new Error("XCF_BaseType.RGB should be 0");
  }
  if (XCF_BaseType.GRAYSCALE !== 1) {
    throw new Error("XCF_BaseType.GRAYSCALE should be 1");
  }
  if (XCF_BaseType.INDEXED !== 2) {
    throw new Error("XCF_BaseType.INDEXED should be 2");
  }

  // Test 2: Parse grey.xcf (grayscale v011 file with 64-bit pointers)
  const greyParser = await XCFParser.parseFileAsync(path.resolve(__dirname, "../../../../example-xcf/grey.xcf"));
  
  if (greyParser.baseType !== XCF_BaseType.GRAYSCALE) {
    throw new Error(`Expected grey.xcf baseType to be GRAYSCALE (1), got ${greyParser.baseType}`);
  }

  // Test 3: Verify grey.xcf dimensions and layers
  if (greyParser.width !== 1920 || greyParser.height !== 1080) {
    throw new Error(`Expected grey.xcf to be 1920x1080, got ${greyParser.width}x${greyParser.height}`);
  }

  if (greyParser.layers.length !== 2) {
    throw new Error(`Expected grey.xcf to have 2 layers, got ${greyParser.layers.length}`);
  }

  // Test 4: Verify v011 detection
  if (!greyParser.isV11) {
    throw new Error("Expected grey.xcf to be detected as v011 format");
  }

  // Test 5: Render grayscale image
  const image = new XCFPNGImage(greyParser.width, greyParser.height);
  greyParser.createImage(image);

  // Check that pixels were rendered (not all black)
  const pixelData = image.getPixelData();
  let hasNonBlackPixels = false;
  for (let i = 0; i < pixelData.length; i += 4) {
    if (pixelData[i] > 0 || pixelData[i + 1] > 0 || pixelData[i + 2] > 0) {
      hasNonBlackPixels = true;
      break;
    }
  }
  if (!hasNonBlackPixels) {
    throw new Error("Grayscale image appears to be all black - rendering may have failed");
  }

  // Test 6: Verify RGB file still works
  const rgbParser = await XCFParser.parseFileAsync(path.resolve(__dirname, "../../../../example-xcf/single.xcf"));
  if (rgbParser.baseType !== XCF_BaseType.RGB) {
    throw new Error(`Expected single.xcf baseType to be RGB (0), got ${rgbParser.baseType}`);
  }
  if (rgbParser.isV11) {
    throw new Error("Expected single.xcf to not be v011 format");
  }

  Logger.log(
    "PASS: Grayscale support (grey.xcf v011 parsing and rendering work correctly)",
  );
}
