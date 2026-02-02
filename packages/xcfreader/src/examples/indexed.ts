/**
 * Example: Parse and render an indexed color XCF file
 *
 * Demonstrates:
 * - Parsing indexed/paletted XCF files
 * - Accessing the colormap (palette)
 * - Rendering indexed images to PNG
 */
import { XCFParser, XCFPNGImage, XCF_BaseType } from "../node.js";
import { Logger } from "../lib/logger.js";
import FS from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  const xcfPath = path.resolve(__dirname, "../../examples/indexed.xcf");
  const outputDir = path.resolve(__dirname, "../../examples/output/indexed");

  Logger.log(`Parsing ${xcfPath}...`);

  const parser = await XCFParser.parseFileAsync(xcfPath);

  Logger.log(
    `Image type: ${parser.baseType === XCF_BaseType.INDEXED ? "Indexed" : parser.baseType === XCF_BaseType.GRAYSCALE ? "Grayscale" : "RGB"}`,
  );
  Logger.log(`Dimensions: ${parser.width}x${parser.height}`);
  Logger.log(`Layers: ${parser.layers.length}`);

  // Check if this is an indexed image and display colormap info
  if (parser.baseType === XCF_BaseType.INDEXED) {
    Logger.log("✓ This is an indexed color image");
    const colormap = parser.colormap;
    if (colormap) {
      Logger.log(`Colormap has ${colormap.length} colors`);
      // Show first 10 colors
      const preview = colormap.slice(0, 10);
      preview.forEach((color, i) => {
        Logger.log(
          `  Color ${i}: rgb(${color.red}, ${color.green}, ${color.blue})`,
        );
      });
      if (colormap.length > 10) {
        Logger.log(`  ... and ${colormap.length - 10} more colors`);
      }
    }
  } else {
    Logger.log("✗ This is not an indexed color image");
  }

  // Display layers
  Logger.log("\nLayers:");
  parser.layers.forEach((layer) => {
    const visibility = layer.isVisible ? "👁️" : "  ";
    Logger.log(
      `  ${visibility} ${layer.name} (${layer.width}x${layer.height})`,
    );
  });

  // Render to PNG
  const image = new XCFPNGImage(parser.width, parser.height);
  parser.createImage(image);

  if (!FS.existsSync(outputDir)) {
    FS.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = `${outputDir}/output.png`;
  await image.writeImage(outputPath);
  Logger.log(`\nImage saved to ${outputPath}`);
}

main().catch((err) => {
  Logger.error("Error:", err);
  process.exit(1);
});
