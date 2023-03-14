import { XCFParser, XCFImage } from '../src/gimpparser';
import Lazy from 'lazy.js';
import fs from 'fs';
import Mkdirp from 'mkdirp';
import JsonFile from 'jsonfile';


saveLayer('/home/andi/development/xcfreader/examples/empty.xcf', (err) => console.log(err));

function saveLayer(dir, callback) {
    XCFParser.parseFile(dir, (err1, parser) => {
        if (err1) throw err1;

        var details = {};

        Lazy(parser.layers).each(function (layer) {
            var groupName = layer.groupName;

            var fullDirectory = dir.substr(0, dir.lastIndexOf('/')) + '/' + groupName.substr(0, groupName.lastIndexOf('/'));
            details[groupName] = {
                x: layer.x,
                y: layer.y,
                w: layer.width,
                h: layer.height,
            };

            if (layer.isVisible && !layer.isGroup) {
                //console.log(groupName);

                if (!fs.existsSync(fullDirectory)) {
                    Mkdirp.sync(fullDirectory);
                }

                var png = dir.substr(0, dir.lastIndexOf('/')) + '/' + groupName + '.png';

                layer.makeImage().writeImage(png, function (err4) {
                    if (err4) throw err4;

                    console.log(png + " written");
                });
            }
        });
    });
}