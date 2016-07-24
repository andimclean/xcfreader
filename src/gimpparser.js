
import {Parser} from 'binary-parser';
import FS from 'fs';
//const Buffer = require('buffer');
import {Buffer} from 'buffer';
import Lazy from 'lazy.js';

const PROP_END                =  0;
const PROP_COLORMAP           =  1;
const PROP_ACTIVE_LAYER       =  2;
const PROP_ACTIVE_CHANNEL     =  3;
const PROP_SELECTION          =  4;
const PROP_FLOATING_SELECTION =  5;
const PROP_OPACITY            =  6;
const PROP_MODE               =  7;
const PROP_VISIBLE            =  8;
const PROP_LINKED             =  9;
const PROP_LOCK_ALPHA         = 10;
const PROP_APPLY_MASK         = 11;
const PROP_EDIT_MASK          = 12;
const PROP_SHOW_MASK          = 13;
const PROP_SHOW_MASKED        = 14;
const PROP_OFFSETS            = 15;
const PROP_COLOR              = 16;
const PROP_COMPRESSION        = 17;
const PROP_GUIDES             = 18;
const PROP_RESOLUTION         = 19;
const PROP_TATTOO             = 20;
const PROP_PARASITES          = 21;
const PROP_UNIT               = 22;
const PROP_PATHS              = 23;
const PROP_USER_UNIT          = 24;
const PROP_VECTORS            = 25;
const PROP_TEXT_LAYER_FLAGS   = 26;
const PROP_SAMPLE_POINTS      = 27;
const PROP_LOCK_CONTENT       = 28;
const PROP_GROUP_ITEM         = 29;
const PROP_ITEM_PATH          = 30;
const PROP_GROUP_ITEM_FLAGS   = 31;

const PROP_MODE_NORMAL        = 0;
const PROP_MODE_DISSOLVE      = 1;
const PROP_MODE_BEHIND        = 2;
const PROP_MODE_MULTIPLY      = 3;
const PROP_MODE_SCREEN        = 4;
const PROP_MODE_OVERLAY       = 5;
const PROP_MODE_DIFFERENCE    = 6;
const PROP_MODE_ADDITION      = 7;
const PROP_MODE_SUBTRACT      = 8;
const PROP_MODE_DRAKEN_ONLY   = 9;
const PROP_MODE_LIGHTEN_ONLY  = 10;
const PROP_MODE_HUE           = 11;
const PROP_MODE_SATURATION    = 12;
const PROP_MODE_COLOR         = 13;
const PROP_MODE_COLOUR        = 13;
const PROP_MODE_VALUE         = 14;
const PROP_MODE_DIVIDE        = 15;
const PROP_MODE_DODGE         = 16;
const PROP_MODE_BURN          = 17;
const PROP_MODE_HARD_LIGHT    = 18;
const PROP_MODE_SOFT_LIGHT    = 19;
const PROP_MODE_GRAIN_EXTRACT = 20;
const PROP_MODE_GRAIN_MERGE   = 21;

var itemIsZero = function(item, buffer) {
    return item === 0;
};

var rgbParser = new Parser()
    .uint8('red')
    .uint8('greed')
    .uint8('blue');
    
var rgbaParser = new Parser()
    .uint8('red')
    .uint8('greed')
    .uint8('blue')
    .uint8('alpha', {
        formatter: function(aplha) {
            return Math.round((alpha/255) * 100);
        }
    });
    
var prop_colorMapParser = new Parser()
    .uint32('length')
    .uint32('numcolours')
    .array('colours',{
        type: rgbParser,
        length: 'numcolours'
    });

var prop_guidesParser = new Parser()
    .uint32('length')
    .array('guides',{
        type: new Parser().int32('c').int8('o'),
        length: function() { return this.length / 5;}
    });

var prop_modeParser = new Parser()
    .uint32('length',{assert:4})
    .uint32('m');

var propLengthB = new Parser().uint32('length',{assert:4}).uint32('b');

var propLengthF = new Parser().uint32('length',{assert:4}).uint32('f');

var propertyListParser = new Parser()
    .endianess('big')
    .uint32('type')
    .choice('data',{
        tag: 'type',
        choices : {
            [PROP_END]: new Parser().uint32('length',{assert:0}),//0
            [PROP_COLORMAP]:  prop_colorMapParser, //1
            [PROP_MODE]:  prop_modeParser, //7
            [PROP_LOCK_ALPHA]: propLengthB,//10
            [PROP_APPLY_MASK]: propLengthB,//11
            [PROP_EDIT_MASK]: propLengthB,//12
            [PROP_SHOW_MASK]: propLengthB,// 13
            [PROP_OFFSETS]: new Parser().uint32('length',{assert:8}).int32('dx').int32('dy'), // 15
            [PROP_COMPRESSION]: new Parser().uint32('length',{assert:1}).uint8('compressionType'),//17
            [PROP_GUIDES]: prop_guidesParser,//18
            [PROP_RESOLUTION]: new Parser().uint32('length').float('x').float('y'),//19
            [PROP_PARASITES] : new Parser().uint32('length').buffer('parasite',{length:'length'}),
            [PROP_UNIT]: new Parser().uint32('length').uint32('c'),//22
            [PROP_TEXT_LAYER_FLAGS]: propLengthF, // 26
        },
        defaultChoice: new Parser().uint32('length').buffer('buffer', {length:function() {return this.length;}})
    })

var layerParser = new Parser()
    .uint32('width')
    .uint32('height')
    .uint32('type')
    .uint32('name_length')
    .string('name',{
        encoding: 'ascii',
        zeroTerminated: true
    })
    .array(
        'propertyList',
        {
            type : propertyListParser,
            readUntil: function(item,buffer) {
                return item.type === 0;
            }
        }
    )
    .uint32('hptr')
    .uint32('mptr');

var hirerarchyParser = new Parser()
    .uint32('width')
    .uint32('height')
    .uint32('bpp')
    .uint32('lptr');

var levelParser = new Parser()
    .uint32('width')
    .uint32('height')
    .array('tptr',{
        type: 'uint32be',
        readUntil: itemIsZero
    })

var gimpHeader = new Parser()
    .endianess('big')
    .string('magic',{
        encoding: 'ascii',
        length: 9,
        /*assert: function(value, name) {
         
            return value == 'gimp xcf';
        }*/
    })
    .string('version',{
        encoding: 'ascii',
        length: 4,
    })
    .int8('padding',{assert:0})
    .uint32('width')
    .uint32('height')
    .uint32('base_type',{assert:0})
    .array(
        'propertyList',
        {
            type : propertyListParser,
            readUntil: function(item,buffer) {
                return item.type === 0;
            }
        }
    )
    .array(
        'layerList',
        {
            type: 'int32be',
            readUntil : itemIsZero
        }
    )
    .array(
        'channelList',
        {
            type: 'int32be',
            readUntil: itemIsZero
        }
    );

var remove_empty = function(data) {
    return data !== 0;
}

var isUnset = function(value) {
    return value === null || value === undefined;
}

var findProperty = function(propertyList, prop) {
    var prop =  Lazy(propertyList).find( function(property) {
        return property.type == prop;
    });
    if (prop) {
        return prop.data;
    }
    return null;
}

class GimpLayer {
    constructor(parent, buffer) {
        this._parent = parent;
        this._buffer = buffer;
        this._compiled = false;
        this._props = null;
    }

    compile() {
        this._details = layerParser.parse(this._buffer);
        this._compiled = true;
    }

    get name() {
        if (!this._compiled) {
            this.compile();
        }
        return this._details.name;
    }

    get width() {
        if (!this._compiled) {
            this.compile();
        }
        return this._details.width;
    }

    get height() {
        if (!this._compiled) {
            this.compile();
        }
        return this._details.height;
    }

    get x() {
        return this.getProps(PROP_OFFSETS,'dx');
    }

    get y() {
        return this.getProps(PROP_OFFSETS,'dy');
    }

    getProps(prop, index) {
        if (!this._compiled) {
            this.compile();
        }
        
        if (isUnset(this._props)) {
            this._props = {};
            Lazy(this._details.propertyList).each(function(property){
                this._props[property.type] = property;
            }.bind(this));
        }

        if (index && this._props[prop] && this._props[prop]['data']) {
            return this._props[prop]['data'][index];
        }
        return this._props[prop];
    }

    makeImage(image , useOffset) {
        var x = 0, y = 0;
        var hDetails, levels, tilesAcross;
        if (useOffset) {
            x = this.x;
            y = this.y;
        }
        if (image['setMode']) {
            image.setMode(this.getProps(PROP_MODE, 'm'));
        }
        hDetails = hirerarchyParser.parse(this._parent.getBufferForPointer(this._details.hptr));
        levels = levelParser.parse(this._parent.getBufferForPointer(hDetails.lptr));

        tilesAcross = Math.ceil(this.width / 64);
        Lazy(levels.tptr).each(function(tptr , index){
            var xIndex = (index % tilesAcross) * 64;
            var yIndex = Math.floor(index / tilesAcross) * 64;
            var xpoints = Math.min(64, this.width - xIndex);
            var ypoints = Math.min(64, this.height - yIndex);
            this.copyTile(
                image, 
                this.uncompress(
                    this._parent.getBufferForPointer(tptr),
                    xpoints,
                    ypoints,
                    hDetails.bpp),
                 x + xIndex , 
                 y + yIndex, 
                 xpoints, 
                 ypoints, 
                 hDetails.bpp);
        }.bind(this));
    }

    uncompress(compressedData, xpoints, ypoints, bpp) {
        var size = xpoints * ypoints;
        var tileBuffer = new Buffer(size * bpp);
        var compressOffset = 0;
        for( var bppLoop = 0 ; bppLoop < bpp; bppLoop +=1) {
            size = xpoints * ypoints;
            var offset = bppLoop;
            
            while (size > 0) {
                var length = compressedData[compressOffset];
            
                compressOffset +=1;
                if (length < 127) {
                    var newLength = length;
                    var byte = compressedData[compressOffset];
                    compressOffset +=1;
                    while(newLength >= 0) {
                        tileBuffer[offset] = byte;
                        offset += bpp;
                        size -=1;
                        newLength-=1;
                    }
                } else if (length === 127) {
                    var newLength = compressedData[compressOffset] * 256 + compressedData[compressOffset+1];
                    compressOffset +=2;
                    var byte = compressedData[compressOffset];
                    compressOffset +=1;
                    while(newLength > 0) {
                        tileBuffer[offset] = byte;
                        offset += bpp;
                        size -=1;
                        newLength-=1;
                    }
                } else if (length === 128) {
                    var newLength = compressedData[compressOffset] * 256 + compressedData[compressOffset+1];
                    compressOffset +=2;
                    
                    while(newLength > 0) {
                        tileBuffer[offset] = compressedData[compressOffset];
                        compressOffset +=1;
                        offset += bpp;
                        size -=1;
                        newLength-=1;
                    }
                } else {
                    var newLength = 256 - length;
                    while(newLength > 0) {
                        tileBuffer[offset] = compressedData[compressOffset];
                        compressOffset +=1;
                        offset += bpp;
                        size -=1;
                        newLength-=1;
                    }
                }
            }
        }
        return tileBuffer;
    }
    copyTile(image, tileBuffer, xoffset, yoffset, xpoints, ypoints, bpp) {
        var bufferOffset = 0;
        
        for(var yloop = 0; yloop < ypoints; yloop +=1) {
            for(var xloop = 0; xloop < xpoints; xloop +=1) {
                var colour = {
                    red: tileBuffer[bufferOffset],
                    green: tileBuffer[bufferOffset + 1],
                    blue: tileBuffer[bufferOffset + 2]
                }
                if (bpp === 4) {
                    colour.alpha = tileBuffer[bufferOffset + 3];
                }
                image.setAt(xoffset + xloop , yoffset + yloop, colour);
                bufferOffset += bpp;
            }
        }
    }
}

class GimpChannel {
    constructor(parent, buffer) {
        this._parent = parent;
        this._buffer = buffer;
        this._compiled = false;
    }
}
class GimpParser {
    static parseFile(file, callback) {
        var parser = new GimpParser;
        FS.readFile(file, function(err, data) {
            if (err) callback(err);
            
            try {
                parser.parse(data);
                callback(null, parser);    
            } catch (error) {
                callback(error);
            }
            
        });
    }

    constructor() {
        this._layers = {};
        this._channels = {}
        this._buffer = null;
        this._header = null;
    }

    
    parse(buffer) {
        this._buffer = buffer;
        this._layers = {};
        this._channels = {};
        this._header = gimpHeader.parse(buffer);
        
        this._layers = Lazy(this._header.layerList).filter(remove_empty).map(function(layerPointer){
            return new GimpLayer(this,this._buffer.slice(layerPointer));
        }.bind(this)).toArray();
        
        this._channels = Lazy(this._header.channelList).filter(remove_empty).map(function(channelPointer){
            return new GimpChannel(this,this._buffer.slice(channelPointer));
        }.bind(this)).toArray();
        
    }

    getBufferForPointer(offset) {
        return this._buffer.slice(offset);
    }

    get width() {
        
        return this._header.width;
    }

    get height() {
        return this._header.height;
    }

    get layers() {
        return this._layers;
    }
}

export default GimpParser;