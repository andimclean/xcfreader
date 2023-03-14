import { XCFParser as GimpParser } from '../src/gimpparser';
import PNGImage from 'pngjs-image';

GimpParser.parseFile('/home/andi/development/xcfreader/examples/single.xcf', function (err, parser) {
    if (err) throw err;
    var layers;
    console.log("finished");
    console.log("width : " + parser.width);
    console.log("height : " + parser.height);

    layers = parser.layers;


    var image = PNGImage.createImage(layers[0].width, layers[0].height);
    console.log(image);
    layers[0].makeImage(image, true);
    image.writeImage('/home/andi/development/xcfreader/examples/output/single.png', function (err) {
        if (err) throw err;
        console.log("Image written to file");
    });
});
