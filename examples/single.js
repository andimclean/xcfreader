import { XCFParser as GimpParser } from '../src/gimpparser.js';
import PNGImage from 'pngjs-image';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, 'single.xcf');
const outDir = path.resolve(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    console.log('finished');
    console.log('width : ' + parser.width);
    console.log('height : ' + parser.height);

    const layers = parser.layers;
    const image = PNGImage.createImage(layers[0].width, layers[0].height);
    console.log(image);
    layers[0].makeImage(image, true);
    image.writeImage(path.resolve(outDir, 'single.png'), function (err) {
      if (err) throw err;
      console.log('Image written to file');
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
