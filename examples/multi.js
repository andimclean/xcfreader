import GimpParser from '../src/gimpparser';
import PNGImage from 'pngjs-image';
import Lazy from 'lazy.js';
 
GimpParser.parseFile('/home/andi/development/xcfReader/examples/multi.xcf',function(err, parser) {
    if (err) throw err;
    var layers = parser.layers;
    var image = PNGImage.createImage(parser.width,parser.height);

    Lazy(layers).reverse().each(function(layer) {
        var layerImage = PNGImage.createImage(layer.width,layer.height);

        layer.makeImage(image,true);
        layer.makeImage(layerImage,false);
        layerImage.writeImage('/home/andi/development/xcfReader/examples/output/'+ layer.name+ '.png');
    });

    image.writeImage('/home/andi/development/xcfReader/examples/output/multi.png');
});
