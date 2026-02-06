import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test25DuplicateLayerNames(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../../../example-xcf/maingradient.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  if (!parser) throw new Error('Parser failed');
  if (parser.layers.length < 2) throw new Error('Expected at least 2 layers');

  // Check for duplicate layer names (both named "Background")
  const layerNames = parser.layers.map(layer => layer.name);
  const hasDuplicates = layerNames.length !== new Set(layerNames).size;
  if (!hasDuplicates) throw new Error('Expected duplicate layer names');

  // Verify getLayerByName() returns a valid layer
  const backgroundLayer = parser.getLayerByName('Background');
  if (!backgroundLayer) throw new Error('getLayerByName("Background") should return a layer');

  Logger.log('PASS: Duplicate layer names (maingradient.xcf) handled correctly');
}
