import { XCFParser as GimpParser, XCFImage } from '../src/gimpparser.js';
import PNGImage from 'pngjs-image';
import Lazy from 'lazy.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, 'multi.xcf');
const outDir = path.resolve(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

GimpParser.parseFile(xcfPath, function (err, parser) {
  if (err) throw err;
  var layers = parser.layers;
  var image = new XCFImage(parser.width, parser.height);
  console.log(parser.groupLayers);

  Lazy(layers)
    .reverse()
    .each(function (layer) {
      var layerImage = layer.makeImage();
      console.log(layer.name);
      layer.makeImage(image, true);
      layerImage.writeImage(path.resolve(outDir, layer.name + '.png'));
    });

  image.writeImage(path.resolve(outDir, 'multi1.png'), function () {
    console.log('Image 1 saved');
  });

  parser
    .createImage()
    .writeImage(path.resolve(outDir, 'multi2.png'), function () {
      console.log('Image 2 saved');
    });
});
