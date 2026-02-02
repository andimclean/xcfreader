/**
 * Example: Parsing and rendering a grayscale XCF file
 *
 * Demonstrates:
 * - Parsing a grayscale XCF file
 * - Checking the image base type (RGB vs Grayscale)
 * - Rendering grayscale layers to RGB output
 */

import { XCFParser, XCFPNGImage, XCF_BaseType } from "../node.js";
import { Logger } from "../lib/logger.js";
import FS from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  const xcfPath = path.resolve(__dirname, "../../examples/grey.xcf");

  Logger.log(`Parsing ${xcfPath}...`);
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Check the base type
  const baseTypeNames = ["RGB", "Grayscale", "Indexed"];
  Logger.log(`Image type: ${baseTypeNames[parser.baseType]}`);
  Logger.log(`Dimensions: ${parser.width}x${parser.height}`);
  Logger.log(`Layers: ${parser.layers.length}`);

  // Check if it's actually grayscale
  if (parser.baseType === XCF_BaseType.GRAYSCALE) {
    Logger.log("✓ This is a grayscale image");
  } else if (parser.baseType === XCF_BaseType.RGB) {
    Logger.log("This is an RGB image");
  } else if (parser.baseType === XCF_BaseType.INDEXED) {
    Logger.log("This is an indexed color image");
  }

  // List layers
  Logger.log("\nLayers:");
  for (const layer of parser.layers) {
    const visibility = layer.isVisible ? "👁️" : "🚫";
    Logger.log(
      `  ${visibility} ${layer.name} (${layer.width}x${layer.height})`,
    );
  }

  // Render to PNG (grayscale will be converted to RGB automatically)
  const outputDir = path.resolve(__dirname, "../../examples/output/grey");
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
