import { XCFParser, XCFImage } from '../gimpparser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test02CreateImage(): Promise<void> {
  const xcfPath = path.resolve(__dirname, '../../examples/single.xcf');
  const parser = await XCFParser.parseFileAsync(xcfPath);
  const image = parser.createImage();

  if (!image || image.getAt === undefined) {
    throw new Error('createImage did not return a valid XCFImage');
  }

  const pixelColor = image.getAt(0, 0);
  if (pixelColor === undefined || pixelColor.red === undefined) {
    throw new Error('XCFImage.getAt() did not return valid color');
  }

  console.log(
    `PASS: createImage produced image ${parser.width} x ${parser.height}`
  );
}
