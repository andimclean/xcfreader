'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _choices;

var _binaryParser = require('binary-parser');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _buffer = require('buffer');

var _buffer2 = _interopRequireDefault(_buffer);

var _lazy = require('lazy.js');

var _lazy2 = _interopRequireDefault(_lazy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var PROP_END = 0;
var PROP_COLORMAP = 1;
var PROP_MODE = 7;

var PROP_PRESERVE_TRANSPARENCY = 10;
var PROP_APPLY_MASK = 11;
var PROP_EDIT_MASK = 12;
var PROP_SHOW_MASK = 13;
var PROP_OFFSETS = 15;
var PROP_COMPRESSION = 17;
var PROP_GUIDES = 18;
var PROP_RESOLUTION = 19;
var PROP_UNIT = 21;
var PROP_TEXT_LAYER_FLAGS = 26;

var itemIsZero = function itemIsZero(item, buffer) {
    return item === 0;
};

var rgbParser = new _binaryParser.Parser().uint8('r').uint8('g').uint8('b');

var rgbaParser = new _binaryParser.Parser().uint8('r').uint8('g').uint8('b').uint8('a');

var prop_colorMapParser = new _binaryParser.Parser().uint32('length').uint32('numcolours').array('colours', {
    type: rgbParser,
    length: 'numcolours'
});

var prop_guidesParser = new _binaryParser.Parser().uint32('length').array('guides', {
    type: new _binaryParser.Parser().int32('c').int8('o'),
    length: function length() {
        return this.length / 5;
    }
});

var prop_modeParser = new _binaryParser.Parser().uint32('length', { assert: 4 }).uint32('m');

var propLengthB = new _binaryParser.Parser().uint32('length', { assert: 4 }).uint32('b');

var propLengthF = new _binaryParser.Parser().uint32('length', { assert: 4 }).uint32('f');

var propertyListParser = new _binaryParser.Parser().endianess('big').uint32('type').choice('data', {
    tag: 'type',
    choices: (_choices = {}, _defineProperty(_choices, PROP_END, new _binaryParser.Parser().uint32('propend', { asset: 0 })), _defineProperty(_choices, PROP_COLORMAP, prop_colorMapParser), _defineProperty(_choices, PROP_MODE, prop_modeParser), _defineProperty(_choices, PROP_PRESERVE_TRANSPARENCY, propLengthB), _defineProperty(_choices, PROP_APPLY_MASK, propLengthB), _defineProperty(_choices, PROP_EDIT_MASK, propLengthB), _defineProperty(_choices, PROP_SHOW_MASK, propLengthB), _defineProperty(_choices, PROP_OFFSETS, new _binaryParser.Parser().uint32('length', { assert: 8 }).int32('dx').int32('dy')), _defineProperty(_choices, PROP_COMPRESSION, new _binaryParser.Parser().uint8('compressionType', { assert: 1 })), _defineProperty(_choices, PROP_GUIDES, prop_guidesParser), _defineProperty(_choices, PROP_RESOLUTION, new _binaryParser.Parser().uint32('length').float('x').float('y')), _defineProperty(_choices, PROP_UNIT, new _binaryParser.Parser().uint32('length').uint32('c')), _defineProperty(_choices, PROP_TEXT_LAYER_FLAGS, propLengthF), _choices)
});

var layerParser = new _binaryParser.Parser().uint32('width').uint32('height').uint32('type').uint32('name_length').string('name', {
    encoding: 'ascii',
    zeroTerminated: true
}).array('propertyList', {
    type: propertyListParser,
    readUntil: function readUntil(item, buffer) {
        item.type === 0;
    }
}).uint32('hptr').uint32('mptr');

var gimpHeader = new _binaryParser.Parser().endianess('big').string('magic', {
    encoding: 'ascii',
    length: 9,
    assert: 'gimp xcf'
}).string('version', {
    encoding: 'ascii',
    length: 4
}).int8('padding', { assert: 0 }).uint32('width').uint32('height').uint32('base_type', { assert: 0 }).array('propertyList', {
    type: propertyListParser,
    readUntil: function readUntil(item, buffer) {
        item.type === 0;
    }
}).array('layerList', {
    type: 'int32be',
    readUntil: itemIsZero
}).array('channelList', {
    type: 'int32be',
    readUntil: itemIsZero
});

var remove_empty = function remove_empty(data) {
    return data !== 0;
};

var isUnset = function isUnset(value) {
    return value === null || value === undefined;
};

var findProperty = function findProperty(propertyList, prop) {
    return (0, _lazy2.default)(propertyList).find(function (property) {
        return property.type == prop;
    });
};

var GimpLayer = function () {
    function GimpLayer(parent, buffer) {
        _classCallCheck(this, GimpLayer);

        this._parent = parent;
        this._buffer = buffer;
        this._compiled = false;
    }

    _createClass(GimpLayer, [{
        key: 'compile',
        value: function compile() {
            this._details = layerParser.parse(this._buffer);
            this._compiled = true;
        }
    }, {
        key: 'getxy',
        value: function getxy() {
            this.xy = findProperty(this._details.propertyList, PROP_OFFSETS);

            if (isUnset(this.xy)) {
                throw new Error('Unable to find the x and y offset for the layer');
            }
        }
    }, {
        key: 'width',
        get: function get() {
            if (!this._compiled) {
                this.compile();
            }
            return this._details.width;
        }
    }, {
        key: 'height',
        get: function get() {
            if (!this._compiled) {
                this.compile();
            }
            return this._details.width;
        }
    }, {
        key: 'x',
        get: function get() {
            if (!this._compiled) {
                this.compile();
            }
            if (isUnset(this.xy)) {
                getxy();
            }
            return this.xy.x;
        }
    }, {
        key: 'y',
        get: function get() {
            if (!this._compiled) {
                this.compile();
            }
            if (isUnset(this.xy)) {
                getxy();
            }
            return this.xy.y;
        }
    }]);

    return GimpLayer;
}();

var GimpChannel = function GimpChannel(parent, buffer) {
    _classCallCheck(this, GimpChannel);

    this._parent = parent;
    this._buffer = buffer;
    this._compiled = false;
};

var GimpParser = function () {
    function GimpParser() {
        _classCallCheck(this, GimpParser);

        this._layers = {};
        this._channels = {};
        this._buffer = null;
        this._header = null;
    }

    _createClass(GimpParser, [{
        key: 'parseFile',
        value: function parseFile(file) {
            var self = this;
            _fs2.default.readFile(file, function (err, data) {
                data = _buffer2.default.from(data);
                console.log(_buffer2.default.isBuffer(data));
                self.parse(data);
            });
        }
    }, {
        key: 'parse',
        value: function parse(buffer) {
            console.log("andi is the best");
            this._buffer = buffer;
            this._layers = {};
            this._channels = {};
            this._header = gimpHeader.parse(buffer);
            console.log(this._header);
            this._layers = (0, _lazy2.default)(this._header.layerList).filter(remove_empty).map(function (layerPointer) {
                return new GimpLayer(this, this._buffer.slice(layerPointer));
            }.bind(this)).toArray();

            this._channels = (0, _lazy2.default)(this._header.channelList).filter(remove_empty).map(function (channelPointer) {
                return new GimpChannel(this.this._buffer.slice(channelPointer));
            }.bind(this)).toArray();
        }
    }, {
        key: 'width',
        get: function get() {
            return this._header.width;
        }
    }, {
        key: 'height',
        get: function get() {
            return this._header.height;
        }
    }, {
        key: 'layer',
        get: function get() {
            return this._layers;
        }
    }]);

    return GimpParser;
}();

exports.default = GimpParser;