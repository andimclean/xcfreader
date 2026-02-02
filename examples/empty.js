import { XCFParser, XCFImage } from '../src/gimpparser.js';
import Lazy from 'lazy.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, 'empty.xcf');
const outDirRoot = path.resolve(__dirname);

saveLayer(xcfPath, (err) => console.log(err));

function saveLayer(dir, callback) {
  XCFParser.parseFile(dir, (err1, parser) => {
    if (err1) throw err1;

    var details = {};

    Lazy(parser.layers).each(function (layer) {
      var groupName = layer.groupName;

      var groupPath = path.dirname(groupName);
      var fullDirectory = path.resolve(outDirRoot, groupPath);
      details[groupName] = {
        x: layer.x,
        y: layer.y,
        w: layer.width,
        h: layer.height
      };

      if (layer.isVisible && !layer.isGroup) {
        if (!fs.existsSync(fullDirectory)) {
          fs.mkdirSync(fullDirectory, { recursive: true });
        }

        var png = path.resolve(outDirRoot, groupName + '.png');

        layer.makeImage().writeImage(png, function (err4) {
          if (err4) throw err4;

          console.log(png + ' written');
        });
      }
    });
  });
}
