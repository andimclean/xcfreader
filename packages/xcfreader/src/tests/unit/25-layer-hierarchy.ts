/**
 * Unit tests for layer hierarchy and group layers
 */
import { XCFParser } from "../../gimpparser.js";
import { Logger } from "../../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test25LayerHierarchy(): Promise<void> {
  const map1Path = path.resolve(__dirname, "../../../../../example-xcf/map1.xcf");
  const parser = await XCFParser.parseFileAsync(map1Path);

  // Find group layers
  const groupLayers = parser.layers.filter((layer) => layer.isGroup);

  if (groupLayers.length === 0) {
    throw new Error("Expected at least one group layer in map1.xcf");
  }

  Logger.log(`Found ${groupLayers.length} group layer(s)`);

  // Test group layer structure via parser.groupLayers
  const groupLayerTree = parser.groupLayers;
  if (!groupLayerTree || Object.keys(groupLayerTree).length === 0) {
    throw new Error("Expected group layer tree structure");
  }

  Logger.log(`Group layer tree has ${Object.keys(groupLayerTree).length} root nodes`);

  // Test first group layer properties
  const firstGroup = groupLayers[0]!; // Safe: length checked above
  Logger.log(`Group name: ${firstGroup.name}`);
  Logger.log(`Group is marked as group: ${firstGroup.isGroup}`);

  // Test groupName property (shows hierarchy)
  const layersWithGroupNames = parser.layers.filter((layer) => layer.groupName && layer.groupName.length > 0);
  if (layersWithGroupNames.length > 0) {
    Logger.log(`Found ${layersWithGroupNames.length} layer(s) with group names`);
    Logger.log(`Example: "${layersWithGroupNames[0]!.name}" in group "${layersWithGroupNames[0]!.groupName}"`); // Safe: length checked
  }

  // Verify all layers have valid dimensions
  for (const layer of parser.layers) {
    if (layer.width < 0 || layer.height < 0) {
      throw new Error(`Invalid layer dimensions: ${layer.width}x${layer.height}`);
    }
  }

  Logger.log("PASS: test25LayerHierarchy - Layer hierarchy correct");
}
