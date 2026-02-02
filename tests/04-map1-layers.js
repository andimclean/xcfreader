import { XCFParser } from '../src/gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const file = path.resolve(__dirname, '../examples/map1.xcf');
  const parser = await XCFParser.parseFileAsync(file);
  if (!parser) {
    console.error('Parser returned null for map1.xcf');
    process.exit(2);
  }

  let foundVisible = false;
  for (const layer of parser.layers) {
    if (layer.isVisible && !layer.isGroup) {
      foundVisible = true;
      const img = layer.makeImage();
      if (!img) {
        console.error(
          'makeImage() returned null for visible layer',
          layer.name
        );
        process.exit(2);
      }
    }
  }

  console.log(
    'PASS: map1.xcf parsed, visible non-group layers found=',
    foundVisible
  );
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
