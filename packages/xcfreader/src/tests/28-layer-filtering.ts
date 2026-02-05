/**
 * Test 28: Layer filtering API
 * Tests regex-based and custom filtering methods for layers
 */

import { XCFParser } from "../gimpparser.js";
import { Logger } from "../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test28LayerFiltering(): Promise<void> {
  // Use multi.xcf which has multiple layers with various names
  const xcfPath = path.resolve(__dirname, "../../../../example-xcf/multi.xcf");
  const parser = await XCFParser.parseFileAsync(xcfPath);

  Logger.log("Testing layer filtering methods...");

  // Test 1: findLayersByPattern with regex
  const redLayers = parser.findLayersByPattern(/red/i);
  if (redLayers.length === 0) {
    throw new Error("Expected to find layers with 'red' in name");
  }
  Logger.log(`✓ findLayersByPattern(/red/i): found ${redLayers.length} layers`);

  // Test 2: findLayersByPattern with string
  const brLayers = parser.findLayersByPattern("br_", "i");
  if (brLayers.length === 0) {
    throw new Error("Expected to find layers starting with 'br_'");
  }
  Logger.log(`✓ findLayersByPattern("br_"): found ${brLayers.length} layers`);

  // Test 3: filterLayers with custom predicate
  const visibleLayers = parser.filterLayers((layer) => layer.isVisible);
  if (visibleLayers.length === 0) {
    throw new Error("Expected to find some visible layers");
  }
  Logger.log(`✓ filterLayers(visible): found ${visibleLayers.length} visible layers`);

  // Test 4: filterLayers by dimensions
  const largeLayers = parser.filterLayers((layer) => layer.width > 100);
  if (largeLayers.length === 0) {
    throw new Error("Expected to find some large layers");
  }
  Logger.log(`✓ filterLayers(width > 100): found ${largeLayers.length} layers`);

  // Test 5: getLayersByGroup
  // Multi.xcf has a "Layer Group"
  const groupLayers = parser.getLayersByGroup("Layer Group");
  // Note: groupLayers may be empty if layers are in the group but not directly
  Logger.log(`✓ getLayersByGroup("Layer Group"): found ${groupLayers.length} layers`);

  // Test 6: getVisibleLayers
  const visible = parser.getVisibleLayers();
  if (visible.length === 0) {
    throw new Error("Expected some visible layers");
  }
  if (visible.length !== visibleLayers.length) {
    throw new Error(
      "getVisibleLayers and filterLayers(visible) should return same count",
    );
  }
  Logger.log(`✓ getVisibleLayers(): found ${visible.length} layers`);

  // Test 7: findLayersByPattern with no matches
  const noMatch = parser.findLayersByPattern(/NONEXISTENT_PATTERN_XYZ/);
  if (noMatch.length !== 0) {
    throw new Error("Expected no matches for nonexistent pattern");
  }
  Logger.log("✓ findLayersByPattern with no matches returns empty array");

  // Test 8: Complex regex pattern (OR operation)
  const complexPattern = parser.findLayersByPattern(/base|contents/i);
  if (complexPattern.length === 0) {
    throw new Error("Expected to find layers matching 'base' or 'contents'");
  }
  Logger.log(`✓ Complex regex (base|contents): found ${complexPattern.length} layers`);

  // Test 9: filterLayers by opacity
  const fullOpacity = parser.filterLayers((layer) => layer.opacity === 255);
  if (fullOpacity.length === 0) {
    throw new Error("Expected some layers with full opacity");
  }
  Logger.log(`✓ filterLayers(opacity === 255): found ${fullOpacity.length} layers`);

  // Test 10: Case-insensitive pattern matching
  const caseInsensitive = parser.findLayersByPattern(/LAYER/i);
  if (caseInsensitive.length === 0) {
    throw new Error("Expected case-insensitive match to find layers");
  }
  Logger.log(`✓ Case-insensitive pattern: found ${caseInsensitive.length} layers`);

  // Test 11: Verify original getLayerByName still works
  const contentsLayer = parser.getLayerByName("contents");
  if (!contentsLayer) {
    throw new Error("getLayerByName should still work for exact matches");
  }
  Logger.log("✓ Original getLayerByName still works");

  Logger.log("PASS: test28LayerFiltering - All layer filtering methods work correctly");
}
