import { XCFParser } from '../gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test08GetLayerByName(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../examples/multi.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);

  // Find a layer by name
  const layers = parser.layers;
  if (layers.length === 0) {
    throw new Error('No layers found in multi.xcf');
  }

  const firstLayerName = layers[0].name;
  const foundLayer = parser.getLayerByName(firstLayerName);

  if (!foundLayer || foundLayer.name !== firstLayerName) {
    throw new Error(`getLayerByName failed to find layer: ${firstLayerName}`);
  }

  // Test not found
  const notFound = parser.getLayerByName('__nonexistent_layer_name__');
  if (notFound !== undefined) {
    throw new Error('getLayerByName should return undefined for missing layer');
  }

  console.log(
    `PASS: getLayerByName found layer "${firstLayerName}" in multi.xcf`
  );
}
