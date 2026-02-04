/**
 * Test createImageFromLayers() method
 */
import { XCFParser, XCFPNGImage } from "../node.js";
import { Logger } from "../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test13CreateImageFromLayers(): Promise<void> {
  const xcfPath = path.resolve(__dirname, "../../../../example-xcf/multi.xcf");
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Test 1: Create image from specific layers
  const image1 = new XCFPNGImage(parser.width, parser.height);
  const result1 = parser.createImageFromLayers(image1, ["base", "shaded"]);

  if (result1 !== image1) {
    throw new Error("createImageFromLayers should return the same image");
  }

  // Test 2: Empty layer list should work (return empty image)
  const image2 = new XCFPNGImage(parser.width, parser.height);
  parser.createImageFromLayers(image2, []);

  // Test 3: Non-existent layer names should be ignored
  const image3 = new XCFPNGImage(parser.width, parser.height);
  parser.createImageFromLayers(image3, ["nonexistent", "base"]);

  // Test 4: ignoreVisibility option
  const image4 = new XCFPNGImage(parser.width, parser.height);
  parser.createImageFromLayers(image4, ["base"], { ignoreVisibility: true });

  Logger.log(
    "PASS: createImageFromLayers() works correctly with various inputs"
  );
}
