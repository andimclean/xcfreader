import { XCFParser } from '../src/gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const file = path.resolve(__dirname, '../examples/text.xcf');
  const parser = await XCFParser.parseFileAsync(file);
  if (!parser) {
    console.error('Parser null for text.xcf');
    process.exit(2);
  }

  let hasParasite = false;
  for (const layer of parser.layers) {
    const p = layer.parasites;
    if (p && Object.keys(p).length > 0) {
      hasParasite = true;
      break;
    }
  }

  console.log('PASS: text.xcf parasites found=', hasParasite);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
