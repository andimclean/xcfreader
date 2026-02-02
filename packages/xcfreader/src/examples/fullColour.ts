/**
 * Example: Parse and render a full color RGB XCF file (v011 format)
 *
 * Demonstrates:
 * - Parsing an RGB XCF file with GIMP 2.10+ v011 format
 * - Verifying the image is RGB color mode
 * - Checking precision (bit depth) for high bit-depth images
 * - Rendering to PNG output
 */
import { XCFParser, XCFPNGImage, XCF_BaseType, XCF_Precision } from "../node.js";
import { Logger } from "../lib/logger.js";
import FS from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map precision values to human-readable names
const precisionNames: Record<number, string> = {
  [XCF_Precision.U8_LINEAR]: "8-bit linear integer",
  [XCF_Precision.U8_GAMMA]: "8-bit gamma integer",
  [XCF_Precision.U16_LINEAR]: "16-bit linear integer",
  [XCF_Precision.U16_GAMMA]: "16-bit gamma integer",
  [XCF_Precision.U32_LINEAR]: "32-bit linear integer",
  [XCF_Precision.U32_GAMMA]: "32-bit gamma integer",
  [XCF_Precision.HALF_LINEAR]: "16-bit linear float (half)",
  [XCF_Precision.HALF_GAMMA]: "16-bit gamma float (half)",
  [XCF_Precision.FLOAT_LINEAR]: "32-bit linear float",
  [XCF_Precision.FLOAT_GAMMA]: "32-bit gamma float",
  [XCF_Precision.DOUBLE_LINEAR]: "64-bit linear float (double)",
  [XCF_Precision.DOUBLE_GAMMA]: "64-bit gamma float (double)",
};

async function main(): Promise<void> {
  const xcfPath = path.resolve(__dirname, "../../examples/fullColour.xcf");
  const outputDir = path.resolve(__dirname, "../../examples/output/fullColour");

  Logger.log(`Parsing ${xcfPath}...`);

  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Display image info
  const baseTypeNames = ["RGB", "Grayscale", "Indexed"];
  Logger.log(`Image type: ${baseTypeNames[parser.baseType]}`);
  Logger.log(`Dimensions: ${parser.width}x${parser.height}`);
  Logger.log(`XCF Version: ${parser.isV11 ? "v011 (64-bit)" : "v010 (32-bit)"}`);
  Logger.log(`Precision: ${precisionNames[parser.precision] || parser.precision}`);
  Logger.log(`Bytes per channel: ${parser.bytesPerChannel}`);
  Logger.log(`Layers: ${parser.layers.length}`);

  // Verify it's an RGB image
  if (parser.baseType === XCF_BaseType.RGB) {
    Logger.log("✓ This is a full color RGB image");
  } else {
    Logger.log(`✗ Expected RGB, got ${baseTypeNames[parser.baseType]}`);
  }

  // List layers
  Logger.log("\nLayers:");
  for (const layer of parser.layers) {
    const visibility = layer.isVisible ? "👁️" : "🚫";
    Logger.log(
      `  ${visibility} ${layer.name} (${layer.width}x${layer.height})`,
    );
  }

  // Create output directory and render
  if (!FS.existsSync(outputDir)) {
    FS.mkdirSync(outputDir, { recursive: true });
  }

  const image = new XCFPNGImage(parser.width, parser.height);
  parser.createImage(image);

  const outputPath = path.join(outputDir, "output.png");
  await image.writeImage(outputPath);
  Logger.log(`\nImage saved to ${outputPath}`);
}

main().catch(Logger.error);
