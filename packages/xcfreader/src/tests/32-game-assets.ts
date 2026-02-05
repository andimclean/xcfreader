import { XCFParser } from '../gimpparser.js';
import { Logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test32GameAssets(): Promise<void> {
  // Test boardpieces.xcf
  const boardPath = path.resolve(__dirname, '../../../../example-xcf/boardpieces.xcf');
  const boardParser = await XCFParser.parseFileAsync(boardPath);

  if (
    boardParser.width !== 48 ||
    boardParser.height !== 192 ||
    boardParser.layers.length !== 5
  ) {
    throw new Error('Failed to parse boardpieces.xcf correctly');
  }

  // Test currentpieces.xcf
  const currentPath = path.resolve(__dirname, '../../../../example-xcf/currentpieces.xcf');
  const currentParser = await XCFParser.parseFileAsync(currentPath);

  if (
    currentParser.width !== 23 ||
    currentParser.height !== 92 ||
    currentParser.layers.length !== 4
  ) {
    throw new Error('Failed to parse currentpieces.xcf correctly');
  }

  // Test wallpieces.xcf
  const wallPath = path.resolve(__dirname, '../../../../example-xcf/wallpieces.xcf');
  const wallParser = await XCFParser.parseFileAsync(wallPath);

  if (
    wallParser.width !== 14 ||
    wallParser.height !== 56 ||
    wallParser.layers.length !== 5
  ) {
    throw new Error('Failed to parse wallpieces.xcf correctly');
  }

  Logger.log(
    `PASS: Game assets (boardpieces, currentpieces, wallpieces parsed successfully)`
  );
}
