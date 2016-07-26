# xcfreader
## Parses files generated by Gimp (.xcf)

xcfreader can

* Parse a gimp file.
* Provide image width and height information.
* Provide layer information including width, height, x offset in the main image, y offset from the main image.
* Render each layer using an image generator
* Flatten the file using an image generator


xcfreader only supports

* rgb and rgba file formats.
* raster images

xcfreader todo

* support text layers.
* support indexed images
* support grayscale images
* support paths
* perform proper layer flattening. (Currently the pixel is over written by the layer)

### Installation

Install this module with the following command:

```sh
npm install xcfreader
```

Add the module to your package.json dependencies:

```sh
npm install --save xcfreader
```

Add the module to your package.json dev-dependencies

```sh
npm install --save-dev xcfreader
```

### Usage

Require the module
```js
import XCFReader from 'xcfreader';
```

Read a file
```js
    XCFReader.parseFile('./myimage.xcf, function(err, xcfReader){
        if (err) throw err;

        // Get width and height
        console.log(xcfReader.width);
        console.log(xcfReader.height);

        // Get the number of layers
        console.log(xcfReader.layers.length);

        // Get the width and height of the top layer
        console.log(xcfreader.layers[0].width);
        console.log(xcfreader.layers[0].height);

        // Flattern an image
        var xcf = new XCFImage() // should call your Image class.
        xcf.fill({red:0, green:0, blue: 0, alpha: 255}); // You need to set up the image with the default background for the image.

        // Layer[0] is the top most layer whilst layer[layer.length-1] is the lowest level
        // So we need to apply from the end of the layer array. 
        var numLayers = xcfreader.layers.length;
        for(var loop = numLayers -1; loop >=0; loop -=1){
            xcfreader.layers[loop].makeImage(xcf,true); // Put the current layer on to the image.
        }

        xcf.save('myImage.png');
    });
```

Saving an Image
If you want to save either the layer images or the whole image you need to provide a class instance that implements the folling interface

```js
  XCFImageInterface {

      //set a pixel at a given position.
      // @param x the x co-ordinate to set (Can be outside of the image);
      // @param y the y co-ordinate to set (Can be outside of the image);
      // @param colour { red:<0-255> , green:<0-255> , blue: <0-255>, alpha: <o-255>} // alpha is only include if the layer includes transparancy informatin 
      setAt(int: x, int: y, obj: colour);

      // get the pixel at a given position ( Not currently used, but will in the future to perform flattening)
      // @param x the x co-ordinate to set (Can be outside of the image);
      // @param y the y co-ordinate to set (Can be outside of the image);
      // @return colour { red:<0-255> , green:<0-255> , blue: <0-255>, alpha: <o-255>} // alpha is only include if the layer includes transparancy informatin 
      obj: colour getAt(int: x, int: y);
  }
```
  
### Class XCFParser

#### Static methods
**parseImage(string: filename, function: callback)**

`filename` the file to parse

`callback` function(Error:err , GimpParser: xcfReader) called when the parsing has completed.

#### Methods
**createImage(XCFImage image)**

`image` instance of a class derived from the above interface.

Returns the image with all visible layers flattened. If `image` if null then an XCFImage is created of the correct width and height

#### Properties

**`width`**The width of the image

**`height`**The height of the image

**`layers`**An array of GimpLayer objects

### Class GimpLayer

#### Methods
**makeImage(XCFImage: image , boolean: useOffset)**

`image` instance of a class derived from the above interface.

`useOffset` (defaults to false) wether to use the layer offset.

Returns:

| image      | useOffset    | layer is visible|Action        |
|------------|--------------|-----------------|--------------|
| null       | true / false | false           | returns null |
| null       | true         | true            | returns a `XCFImage` the width and height of the main image, with the layer rendered in the correct location|
| null       | false        | true            | returns a `XCFImage` the width and height of the layer|
| `XCFImage` | true / false | false           | returns the passed `XCFImage` unaltered|
| `XCFImage` | true         | true            | returns the passed `XCFImage` with the layer rendered  in the correct location|
| `XCFImage` | false        | true            | returns the passed `XCFImage` with the layer rendered  in the top left corner|

#### Properties
**`name`**The name of the layer

**`width`**The width of the layer

**`height`**The height of the layer

**`x`**The x offset of the layer on the base image

**`y`**The y offset of the layer on the base image


### Class XCFImage
The `XCFImage` wraps round a [pngjs-image](https://www.npmjs.com/package/pngjs-image) object. See the docs of [pngjs-image](https://www.npmjs.com/package/pngjs-image) for details

The `XCFImage` overwrites setAt(x,y,color) and getAt(x,y,colour) to provide functionality describe above