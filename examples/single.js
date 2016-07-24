import GimpParser from '../src/gimpparser';
import PNGImage from 'pngjs-image';

GimpParser.parseFile('/home/andi/development/xcfReader/examples/single.xcf',function(err, parser) {
    if (err) throw err;
    var layers;
    console.log("finished");
    console.log("width : " + parser.width);
    console.log("height : " + parser.height);
    
    layers = parser.layers;
    console.log(PNGImage);

    var image = PNGImage.createImage(layers[0].width,layers[0].height);
    layers[0].makeImage(image , true);
    image.writeImage('/home/andi/development/xcfReader/examples/output/single.png',function(err) {
        if (err) throw err;
        console.log("Image written to file");
    });
});
