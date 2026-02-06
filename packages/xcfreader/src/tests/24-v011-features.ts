import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test24V011Features(): Promise<void> {
  // Test 192608-nhl-marlow.xcf: large dimensions
  const marlowPath = path.resolve(__dirname, '../../../../example-xcf/192608-nhl-marlow.xcf');
  const marlowParser = await XCFParser.parseFileAsync(marlowPath);
  if (!marlowParser) throw new Error('Parser failed for 192608-nhl-marlow.xcf');
  if (!marlowParser.isV11) throw new Error('Expected isV11=true for 192608-nhl-marlow.xcf');
  if (marlowParser.width < 1000) throw new Error('Expected large width for 192608-nhl-marlow.xcf');

  // Test FirstFloor.xcf: 2 layers
  const firstFloorPath = path.resolve(__dirname, '../../../../example-xcf/FirstFloor.xcf');
  const firstFloorParser = await XCFParser.parseFileAsync(firstFloorPath);
  if (!firstFloorParser) throw new Error('Parser failed for FirstFloor.xcf');
  if (!firstFloorParser.isV11) throw new Error('Expected isV11=true for FirstFloor.xcf');
  if (firstFloorParser.layers.length !== 2) {
    throw new Error(`Expected 2 layers in FirstFloor.xcf, got ${firstFloorParser.layers.length}`);
  }

  // Test icon.xcf: hidden layers exist
  const iconPath = path.resolve(__dirname, '../../../../example-xcf/icon.xcf');
  const iconParser = await XCFParser.parseFileAsync(iconPath);
  if (!iconParser) throw new Error('Parser failed for icon.xcf');
  if (!iconParser.isV11) throw new Error('Expected isV11=true for icon.xcf');
  const hasHiddenLayer = iconParser.layers.some(layer => !layer.isVisible);
  if (!hasHiddenLayer) throw new Error('Expected at least one hidden layer in icon.xcf');

  Logger.log('PASS: v011 feature XCF files (192608-nhl-marlow, FirstFloor, icon) parsed correctly');
}
