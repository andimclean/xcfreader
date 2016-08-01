import {XCFParser as GimpParser, XCFImage} from '../src/gimpparser';
import PNGImage from 'pngjs-image';
import Lazy from 'lazy.js';
 
GimpParser.parseFile('/home/andi/development/xcfReader/examples/multi.xcf',function(err, parser) {
    if (err) throw err;
    var layers = parser.layers;
    var image  = new XCFImage(parser.width,parser.height);
    console.log(parser.groupLayers);

    Lazy(layers).reverse().each(function(layer) {        
        var layerImage = layer.makeImage();
        console.log(layer.name);
        layer.makeImage(image,true);
        layerImage.writeImage('/home/andi/development/xcfReader/examples/output/'+ layer.name+ '.png');
    });

    image.writeImage('/home/andi/development/xcfReader/examples/output/multi1.png',function(){console.log("Image 1 saved")});

    parser.createImage().writeImage('/home/andi/development/xcfReader/examples/output/multi2.png',function(){console.log("Image 2 saved")});
});