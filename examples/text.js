import { XCFParser as GimpParser, XCFImage } from '../src/gimpparser.js';
// replaced lazy.js usage with native array methods
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, 'text.xcf');
const outDir = path.resolve(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    var layers = parser.layers;
    var image = new XCFImage(parser.width, parser.height);

    layers
      .slice()
      .reverse()
      .forEach(function (layer) {
        var layerImage = layer.makeImage();
        layer.makeImage(image, true);
        layerImage.writeImage(path.resolve(outDir, layer.name + '.png'));
        console.log(layer.parasites);
      });

    image.writeImage(path.resolve(outDir, 'multi1.png'), function () {
      console.log('Image 1 saved');
    });

    parser
      .createImage()
      .writeImage(path.resolve(outDir, 'multi2.png'), function () {
        console.log('Image 2 saved');
      });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
