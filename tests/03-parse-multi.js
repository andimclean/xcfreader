import { XCFParser } from '../src/gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const file = path.resolve(__dirname, '../examples/multi.xcf');
  const parser = await XCFParser.parseFileAsync(file);
  if (!parser) {
    console.error('Parser returned null for multi.xcf');
    process.exit(2);
  }
  if (!Array.isArray(parser.layers) || parser.layers.length === 0) {
    console.error('Expected layers in multi.xcf');
    process.exit(2);
  }
  console.log('PASS: parsed multi.xcf layers=', parser.layers.length);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
