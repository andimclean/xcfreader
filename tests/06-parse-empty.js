import { XCFParser } from '../src/gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseFilePromise(file) {
  return new Promise((resolve, reject) => {
    XCFParser.parseFile(file, (err, parser) => {
      if (err) reject(err);
      else resolve(parser);
    });
  });
}

async function main() {
  const file = path.resolve(__dirname, '../examples/empty.xcf');
  const parser = await parseFilePromise(file);
  if (!parser) {
    console.error('Parser null for empty.xcf');
    process.exit(2);
  }
  console.log('PASS: parsed empty.xcf layers=', parser.layers.length);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
