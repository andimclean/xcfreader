import { XCFParser } from '../src/gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const file = path.resolve(__dirname, '../examples/single.xcf');
  const parser = await XCFParser.parseFileAsync(file);
  if (!parser || typeof parser.width !== 'number') {
    console.error('Parser missing width or failed to parse');
    process.exit(2);
  }
  if (!Array.isArray(parser.layers) || parser.layers.length === 0) {
    console.error('Parser returned no layers');
    process.exit(2);
  }
  console.log(
    'PASS: parsed',
    file,
    'width=',
    parser.width,
    'layers=',
    parser.layers.length
  );
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
