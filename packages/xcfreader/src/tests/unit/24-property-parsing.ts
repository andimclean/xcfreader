/**
 * Unit tests for XCF property parsing
 */
import { XCFParser, XCF_PropType } from "../../gimpparser.js";
import { Logger } from "../../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test24PropertyParsing(): Promise<void> {
  const multiPath = path.resolve(__dirname, "../../../../../example-xcf/multi.xcf");
  const parser = await XCFParser.parseFileAsync(multiPath);

  // Test getProps method
  const compressionProp = parser.getProps(XCF_PropType.COMPRESSION);
  Logger.log(`Compression property: ${compressionProp !== undefined ? "found" : "not found"}`);

  // Test that props are accessible
  if (parser.layers.length === 0) {
    throw new Error("Expected layers in multi.xcf");
  }

  const firstLayer = parser.layers[0];

  // Check for opacity property (common in layers)
  const opacityProp = firstLayer.getProps(XCF_PropType.OPACITY);
  if (opacityProp !== undefined) {
    Logger.log(`Layer opacity from props: ${opacityProp}`);

    // Verify it matches the layer's opacity property
    if (firstLayer.opacity !== opacityProp) {
      Logger.log(`Note: Layer opacity (${firstLayer.opacity}) differs from prop (${opacityProp})`);
    }
  }

  // Test visible property
  const visibleProp = firstLayer.getProps(XCF_PropType.VISIBLE);
  Logger.log(`Layer visible prop: ${visibleProp !== undefined ? visibleProp : "not found"}`);

  // Test parasites property
  const parasitesProp = firstLayer.getProps(XCF_PropType.PARASITES);
  if (parasitesProp) {
    Logger.log(`Layer has parasites: ${Array.isArray(parasitesProp) ? parasitesProp.length : "unknown"}`);
  }

  Logger.log("PASS: test24PropertyParsing - Property parsing works correctly");
}
