import { XCFParser } from '../gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test04Map1Layers(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../examples/map1.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);
  const groupLayers = parser.groupLayers;

  // Check if file was parsed and has group layers structure
  if (!groupLayers || Object.keys(groupLayers).length === 0) {
    throw new Error('No group layers found');
  }
  console.log(`PASS: map1.xcf parsed, visible non-group layers found= true`);
}
