import { XCFParser as GimpParser, XCFImage } from '../gimpparser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, '../examples/empty.xcf');
const outDir = path.resolve(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    console.log('Layers:', parser.layers.length);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
