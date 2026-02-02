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
  const file = path.resolve(__dirname, '../examples/single.xcf');
  const parser = await parseFilePromise(file);
  const image = parser.createImage();
  if (!image) {
    console.error('createImage() returned null/undefined');
    process.exit(2);
  }
  if (image._width !== parser.width || image._height !== parser.height) {
    console.error('Image dimensions do not match parser header', { imageW: image._width, imageH: image._height, parserW: parser.width, parserH: parser.height });
    process.exit(2);
  }
  console.log('PASS: createImage produced image', image._width, 'x', image._height);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
