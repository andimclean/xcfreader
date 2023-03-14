import { XCFParser as GimpParser, XCFImage } from '../src/gimpparser';
import Lazy from 'lazy.js';

GimpParser.parseFile('/home/andi/development/xcfreader/examples/text.xcf', function (err, parser) {
    if (err) throw err;
    var layers = parser.layers;
    var image = new XCFImage(parser.width, parser.height);


    Lazy(layers).reverse().each(function (layer) {
        var layerImage = layer.makeImage();
        layer.makeImage(image, true);
        layerImage.writeImage('/home/andi/development/xcfreader/examples/output/' + layer.name + '.png');
        console.log(layer.parasites);
    });

    image.writeImage('/home/andi/development/xcfreader/examples/output/multi1.png', function () { console.log("Image 1 saved"); });

    parser.createImage().writeImage('/home/andi/development/xcfreader/examples/output/multi2.png', function () { console.log("Image 2 saved"); });
});