/**
 * Test indexed color mode support using indexed.xcf
 */
import { Logger } from "../lib/logger.js";
import { XCFParser, XCFPNGImage, XCF_BaseType } from "../node.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test15IndexedColorSupport(): Promise<void> {
  // Test 1: Verify colormap is null for RGB images
  const rgbParser = await XCFParser.parseFileAsync(path.resolve(__dirname, "../../../../example-xcf/single.xcf"));
  if (rgbParser.colormap !== null) {
    throw new Error("Expected colormap to be null for RGB image");
  }
  if (rgbParser.baseType !== XCF_BaseType.RGB) {
    throw new Error(`Expected single.xcf baseType to be RGB (0), got ${rgbParser.baseType}`);
  }

  // Test 2: Verify colormap is null for grayscale images
  const greyParser = await XCFParser.parseFileAsync(path.resolve(__dirname, "../../../../example-xcf/grey.xcf"));
  if (greyParser.colormap !== null) {
    throw new Error("Expected colormap to be null for grayscale image");
  }
  if (greyParser.baseType !== XCF_BaseType.GRAYSCALE) {
    throw new Error(`Expected grey.xcf baseType to be GRAYSCALE (1), got ${greyParser.baseType}`);
  }

  // Test 3: Parse indexed.xcf and verify it's detected as indexed
  const indexedParser = await XCFParser.parseFileAsync(path.resolve(__dirname, "../../../../example-xcf/indexed.xcf"));
  if (indexedParser.baseType !== XCF_BaseType.INDEXED) {
    throw new Error(`Expected indexed.xcf baseType to be INDEXED (2), got ${indexedParser.baseType}`);
  }

  // Test 4: Verify colormap exists and has colors
  const colormap = indexedParser.colormap;
  if (!colormap) {
    throw new Error("Expected indexed.xcf to have a colormap");
  }
  if (colormap.length === 0) {
    throw new Error("Expected indexed.xcf colormap to have at least one color");
  }

  // Test 5: Verify colormap colors have valid RGB values
  for (const color of colormap) {
    if (typeof color.red !== "number" || typeof color.green !== "number" || typeof color.blue !== "number") {
      throw new Error("Colormap colors should have red, green, blue number properties");
    }
    if (color.red < 0 || color.red > 255 || color.green < 0 || color.green > 255 || color.blue < 0 || color.blue > 255) {
      throw new Error("Colormap color values should be in range 0-255");
    }
  }

  // Test 6: Render indexed image and verify non-black pixels
  const image = new XCFPNGImage(indexedParser.width, indexedParser.height);
  indexedParser.createImage(image);

  const pixelData = image.getPixelData();
  let hasNonBlackPixels = false;
  for (let i = 0; i < pixelData.length; i += 4) {
    if (pixelData[i]! > 0 || pixelData[i + 1]! > 0 || pixelData[i + 2]! > 0) {
      hasNonBlackPixels = true;
      break;
    }
  }
  if (!hasNonBlackPixels) {
    throw new Error("Indexed image appears to be all black - rendering may have failed");
  }

  Logger.log(
    `PASS: Indexed color support (indexed.xcf parsed with ${colormap.length} colors, renders correctly)`,
  );
}
