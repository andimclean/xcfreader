/**
 * xcfreader - Parse and render GIMP XCF files
 * Copyright (c) 2026 Andi McLean
 * Licensed under the MIT License
 * https://github.com/andimclean/xcfreader
 */

import { Parser } from "binary-parser";
import { Logger } from "./lib/logger.js";
import FS from "fs";
import { Buffer } from "buffer";
import XCFCompositer from "./lib/xcfcompositer.js";
import {
  XCF_PropType,
  XCF_PropTypeMap,
  XCF_BaseType,
  XCF_Precision,
  ColorRGB,
  ColorRGBA,
  IXCFImage,
  ParsedLayer,
  ParsedHierarchy,
  ParsedLevel,
  ParsedGimpHeader,
  ParsedProperty,
  ParsedParasiteItem,
  ParsedParasiteArray,
  ParsedPropItemPath,
  ParsedRGB,
  CompositerMode,
  GroupLayerNode,
} from "./types/index.js";

// Re-export all types for consumers
export * from "./types/index.js";

// NOTE: XCFPNGImage and XCFDataImage are NOT exported from this base module.
// Import from the appropriate entry point:
//   - 'xcfreader/node' for Node.js (includes XCFPNGImage)
//   - 'xcfreader/browser' for browser (includes XCFDataImage)

/**
 * Error thrown when XCF file parsing fails
 */
export class XCFParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XCFParseError";
  }
}

/**
 * Error thrown when unsupported XCF format is encountered
 */
export class UnsupportedFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedFormatError";
  }
}

const itemIsZero = (item: number, _buffer: Buffer): boolean => {
  return item === 0;
};

const stringParser = new Parser().string("data", { zeroTerminated: true });

const rgbParser = new Parser().uint8("red").uint8("greed").uint8("blue");

const prop_colorMapParser = new Parser()
  .uint32("length")
  .uint32("numcolours")
  .array("colours", {
    type: rgbParser,
    length: "numcolours",
  });

const prop_guidesParser = new Parser().uint32("length").array("guides", {
  type: new Parser().int32("c").int8("o"),
  length: function (this: { length: number }) {
    return this.length / 5;
  },
});

const prop_modeParser = new Parser()
  .uint32("length", { assert: 4 })
  .uint32("mode");

const parasiteParser = new Parser()
  .uint32("length")
  .buffer("parasite", { length: "length" });

const parasiteArrayItemParser = new Parser()
  .uint32("name_length")
  .string("name", {
    encoding: "ascii",
    zeroTerminated: true,
  })
  .uint32("flags")
  .uint32("length")
  .buffer("details", { length: "length" });

const fullParasiteParser = new Parser().array("items", {
  type: parasiteArrayItemParser,
  readUntil: "eof",
});

const propLengthF = new Parser().uint32("length", { assert: 4 }).uint32("f");

const propertyListParser = new Parser()
  .endianess("big")
  .uint32("type")
  .choice("data", {
    tag: "type",
    choices: {
      [XCF_PropType.END]: new Parser().uint32("length", { assert: 0 }),
      [XCF_PropType.COLORMAP]: prop_colorMapParser,
      [XCF_PropType.ACTIVE_LAYER]: new Parser().uint32("length", { assert: 0 }),
      [XCF_PropType.ACTIVE_CHANNEL]: new Parser().uint32("length", {
        assert: 0,
      }),
      [XCF_PropType.SELECTION]: new Parser().uint32("length", { assert: 0 }),
      [XCF_PropType.FLOATING_SELECTION]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("layerPtr"),
      [XCF_PropType.OPACITY]: new Parser().uint32("length").uint32("opacity"),
      [XCF_PropType.MODE]: prop_modeParser,
      [XCF_PropType.VISIBLE]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("isVisible"),
      [XCF_PropType.LINKED]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("isLinked"),
      [XCF_PropType.LOCK_ALPHA]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("alpha"),
      [XCF_PropType.APPLY_MASK]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("mask"),
      [XCF_PropType.EDIT_MASK]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("editmask"),
      [XCF_PropType.SHOW_MASK]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("showmask"),
      [XCF_PropType.SHOW_MASKED]: new Parser()
        .uint32("length", { assert: 4 })
        .uint32("showmasked"),
      [XCF_PropType.OFFSETS]: new Parser()
        .uint32("length", { assert: 8 })
        .int32("dx")
        .int32("dy"),
      [XCF_PropType.COLOR]: new Parser()
        .uint32("length", { assert: 3 })
        .int8("r")
        .int8("g")
        .int8("b"),
      [XCF_PropType.COMPRESSION]: new Parser()
        .uint32("length", { assert: 1 })
        .uint8("compressionType"),
      [XCF_PropType.GUIDES]: prop_guidesParser,
      [XCF_PropType.RESOLUTION]: new Parser()
        .uint32("length")
        .floatle("x")
        .floatle("y"),
      [XCF_PropType.TATTOO]: new Parser().uint32("length").uint32("tattoo"),
      [XCF_PropType.PARASITES]: parasiteParser,
      [XCF_PropType.UNIT]: new Parser().uint32("length").uint32("c"),
      [XCF_PropType.TEXT_LAYER_FLAGS]: propLengthF,
      [XCF_PropType.LOCK_CONTENT]: new Parser()
        .uint32("length")
        .uint32("isLocked"),
      [XCF_PropType.GROUP_ITEM]: new Parser().uint32("length", { assert: 0 }),
      [XCF_PropType.ITEM_PATH]: new Parser()
        .uint32("length", {
          formatter: function (value: number) {
            return value / 4;
          },
        })
        .array("items", { type: "uint32be", length: "length" }),
      [XCF_PropType.GROUP_ITEM_FLAGS]: new Parser()
        .uint32("length")
        .uint32("flags"),
    },
    defaultChoice: new Parser().uint32("length").buffer("buffer", {
      length: function (this: { length: number }) {
        return this.length;
      },
    }),
  });

// Helper to check if 64-bit value is zero (for readUntil)
const itemIsZero64 = (item: { high: number; low: number }): boolean => {
  return item.high === 0 && item.low === 0;
};

// Parser for 64-bit big-endian offset
const offset64Parser = new Parser()
  .endianess("big")
  .uint32("high")
  .uint32("low");

// V10 parsers (32-bit pointers)
const layerParserV10 = new Parser()
  .uint32("width")
  .uint32("height")
  .uint32("type")
  .uint32("name_length")
  .string("name", {
    encoding: "ascii",
    zeroTerminated: true,
  })
  .array("propertyList", {
    type: propertyListParser,
    readUntil: function (item: { type: number }, _buffer: Buffer) {
      return item.type === 0;
    },
  })
  .uint32("hptr")
  .uint32("mptr");

const hirerarchyParserV10 = new Parser()
  .uint32("width")
  .uint32("height")
  .uint32("bpp")
  .uint32("lptr");

const levelParserV10 = new Parser()
  .uint32("width")
  .uint32("height")
  .array("tptr", {
    type: "uint32be",
    readUntil: itemIsZero,
  });

// V11 parsers (64-bit pointers)
const layerParserV11 = new Parser()
  .uint32("width")
  .uint32("height")
  .uint32("type")
  .uint32("name_length")
  .string("name", {
    encoding: "ascii",
    zeroTerminated: true,
  })
  .array("propertyList", {
    type: propertyListParser,
    readUntil: function (item: { type: number }, _buffer: Buffer) {
      return item.type === 0;
    },
  })
  .uint32("hptr_high")
  .uint32("hptr_low")
  .uint32("mptr_high")
  .uint32("mptr_low");

const hirerarchyParserV11 = new Parser()
  .uint32("width")
  .uint32("height")
  .uint32("bpp")
  .uint32("lptr_high")
  .uint32("lptr_low");

const levelParserV11 = new Parser()
  .uint32("width")
  .uint32("height")
  .array("tptr64", {
    type: offset64Parser,
    readUntil: itemIsZero64,
  });

// XCF v010 and earlier use 32-bit pointers
const gimpHeaderV10 = new Parser()
  .endianess("big")
  .string("magic", {
    encoding: "ascii",
    length: 9,
  })
  .string("version", {
    encoding: "ascii",
    length: 4,
  })
  .int8("padding", { assert: 0 })
  .uint32("width")
  .uint32("height")
  .uint32("base_type") // 0=RGB, 1=Grayscale, 2=Indexed
  .array("propertyList", {
    type: propertyListParser,
    readUntil: function (item: { type: number }, _buffer: Buffer) {
      return item.type === 0;
    },
  })
  .array("layerList", {
    type: "int32be",
    readUntil: itemIsZero,
  })
  .array("channelList", {
    type: "int32be",
    readUntil: itemIsZero,
  });

// XCF v011+ use 64-bit pointers
const gimpHeaderV11 = new Parser()
  .endianess("big")
  .string("magic", {
    encoding: "ascii",
    length: 9,
  })
  .string("version", {
    encoding: "ascii",
    length: 4,
  })
  .int8("padding", { assert: 0 })
  .uint32("width")
  .uint32("height")
  .uint32("base_type") // 0=RGB, 1=Grayscale, 2=Indexed
  .uint32("precision") // v011 adds precision field
  .array("propertyList", {
    type: propertyListParser,
    readUntil: function (item: { type: number }, _buffer: Buffer) {
      return item.type === 0;
    },
  })
  .array("layerList64", {
    type: offset64Parser,
    readUntil: itemIsZero64,
  })
  .array("channelList64", {
    type: offset64Parser,
    readUntil: itemIsZero64,
  });

const remove_empty = (data: number): boolean => {
  return data !== 0;
};

const isUnset = (value: unknown): boolean => {
  return value === null || value === undefined;
};

/**
 * Represents a single layer in a GIMP XCF file.
 *
 * Provides access to layer properties like name, dimensions, visibility,
 * opacity, blend mode, and position. Layers can be rendered individually
 * or composited together using {@link XCFParser.createImage}.
 *
 * @example
 * ```typescript
 * const parser = await XCFParser.parseFileAsync('./image.xcf');
 * const layer = parser.layers[0];
 * console.log(layer.name, layer.width, layer.height);
 * console.log(`Position: (${layer.x}, ${layer.y})`);
 * console.log(`Visible: ${layer.isVisible}, Opacity: ${layer.opacity}`);
 *
 * // Render just this layer
 * const image = layer.makeImage();
 * await image.writeImage('./layer-output.png');
 * ```
 */
class GimpLayer {
  private _parent: XCFParser;
  private _buffer: Buffer;
  private _compiled: boolean;
  private _props: Partial<XCF_PropTypeMap> | null;
  private _details: ParsedLayer | null;
  private _name?: string;
  private _parasites?: Record<string, Record<string, string>>;

  constructor(parent: XCFParser, buffer: Buffer) {
    this._parent = parent;
    this._buffer = buffer;
    this._compiled = false;
    this._props = null;
    this._details = null;
  }

  compile(): void {
    const parser = this._parent.isV11 ? layerParserV11 : layerParserV10;
    this._details = parser.parse(this._buffer) as ParsedLayer;
    this._compiled = true;
  }

  /**
   * Get the name of this layer
   */
  get name(): string {
    if (!this._compiled) {
      this.compile();
    }
    if (isUnset(this._name)) {
      this._name = this._details!.name;
      let pos = this._name!.indexOf(" copy");

      if (pos > 0) {
        this._name = this._name!.substring(0, pos);
      }
      pos = this._name!.indexOf(" #");
      if (pos > 0) {
        this._name = this._name!.substring(0, pos);
      }

      this._name = this._name!.trim();
    }
    return this._name!;
  }

  get pathInfo(): ParsedProperty | null {
    const prop = this.getProps(XCF_PropType.ITEM_PATH);
    // getProps without index always returns ParsedProperty | null, not number
    return (prop as ParsedProperty | null) ?? null;
  }

  /**
   * Get the full path name of this layer in the layer hierarchy
   */
  get groupName(): string {
    if (!this._compiled) {
      this.compile();
    }
    const pathInfo = this.pathInfo;

    if (!pathInfo) {
      return this.name;
    }

    const pathItems = (pathInfo.data as unknown as ParsedPropItemPath).items;
    let item: GroupLayerNode = this._parent._groupLayers;
    const name: string[] = [];
    for (let index = 0; index < pathItems.length; index += 1) {
      if (item.children) {
        item = item.children[pathItems[index]];
      } else {
        item = (item as unknown as GroupLayerNode[])[pathItems[index]];
      }
      name.push(item.layer!.name);
    }

    return name.join("/");
  }

  /**
   * Get the width of this layer in pixels
   */
  get width(): number {
    if (!this._compiled) {
      this.compile();
    }
    return this._details!.width;
  }

  /**
   * Get the height of this layer in pixels
   */
  get height(): number {
    if (!this._compiled) {
      this.compile();
    }
    return this._details!.height;
  }

  /**
   * Get the X offset of this layer
   */
  get x(): number {
    return this.getProps(XCF_PropType.OFFSETS, "dx") as number;
  }

  /**
   * Get the Y offset of this layer
   */
  get y(): number {
    return this.getProps(XCF_PropType.OFFSETS, "dy") as number;
  }

  /**
   * Check if this layer is visible
   */
  get isVisible(): boolean {
    return this.getProps(XCF_PropType.VISIBLE, "isVisible") !== 0;
  }

  /**
   * Check if this layer is a group (folder)
   */
  get isGroup(): boolean {
    return this.getProps(XCF_PropType.GROUP_ITEM) !== null;
  }

  /**
   * Get the color/blend mode of this layer
   */
  get colourMode(): number {
    return this.getProps(XCF_PropType.MODE, "mode") as number;
  }

  /**
   * Get the blend mode (alias for colourMode)
   */
  get mode(): number {
    return this.colourMode;
  }

  /**
   * Get the opacity of this layer (0-100)
   */
  get opacity(): number {
    return this.getProps(XCF_PropType.OPACITY, "opacity") as number;
  }

  /**
   * Get parasites (metadata) attached to this layer
   */
  get parasites(): Record<string, Record<string, string>> {
    if (this._parasites === undefined) {
      const parasite = this.getProps(
        XCF_PropType.PARASITES,
      ) as ParsedProperty | null;
      this._parasites = {};
      if (parasite) {
        const parasiteData = (parasite.data as unknown as { parasite: Buffer })
          .parasite;
        const parsedParasite = fullParasiteParser.parse(
          parasiteData,
        ) as ParsedParasiteArray;
        (parsedParasite.items || []).forEach(
          (parasiteItem: ParsedParasiteItem) => {
            const parasiteName = parasiteItem.name;
            if (parasiteName === "gimp-text-layer") {
              const text = (
                stringParser.parse(parasiteItem.details) as { data: string }
              ).data;
              const fields: Record<string, string> = {};
              const matches = text.match(/(\(.*\))+/g) || [];
              matches.forEach((item: string) => {
                const itemParts = item.substring(1, item.length - 1).split(" ");
                const key = itemParts[0];
                const value = itemParts.slice(1).join(" ");
                fields[key] = value.replace(/^["]+/, "").replace(/["]+$/, "");
              });
              this._parasites![parasiteName] = fields;
            }
          },
        );
      }
    }
    return this._parasites;
  }

  /**
   * Get a specific property from this layer.
   *
   * Properties contain metadata like opacity, offsets, blend mode, etc.
   * Use the {@link XCF_PropType} enum to specify which property to retrieve.
   *
   * @typeParam T - The property type (inferred from prop parameter)
   * @param prop - The property type to retrieve (from XCF_PropType enum)
   * @param index - Optional sub-field to extract from the property data
   * @returns The property value, a specific field value if index is provided, or null if not found
   *
   * @example
   * ```typescript
   * // Get full property object
   * const offsetProp = layer.getProps(XCF_PropType.OFFSETS);
   *
   * // Get specific field from property
   * const xOffset = layer.getProps(XCF_PropType.OFFSETS, 'dx');
   * const yOffset = layer.getProps(XCF_PropType.OFFSETS, 'dy');
   *
   * // Check if layer is a group
   * const isGroup = layer.getProps(XCF_PropType.GROUP_ITEM) !== null;
   * ```
   */
  getProps<T extends XCF_PropType>(
    prop: T,
    index?: string,
  ): XCF_PropTypeMap[T] | number | null {
    if (!this._compiled) {
      this.compile();
    }

    if (!this._props) {
      this._props = {};
      (this._details!.propertyList || []).forEach(
        (property: ParsedProperty) => {
          (this._props as unknown as Record<XCF_PropType, ParsedProperty>)[
            property.type
          ] = property;
        },
      );
    }

    const propValue = this._props[prop];
    if (index && propValue && "data" in propValue) {
      return (propValue.data as Record<string, number>)[index];
    }
    return propValue ?? null;
  }

  /**
   * Render this layer to an XCFImage.
   *
   * Decompresses the layer's tile data and composites it onto the target image
   * using the layer's blend mode and opacity settings.
   *
   * @param image - The image to render onto. Create with `new XCFImage(width, height)`.
   * @param useOffset - If true, positions the layer using its x/y offset within the parent image dimensions.
   *                    If false, renders at (0,0) with the layer's own dimensions.
   * @returns The XCFImage with this layer rendered onto it
   *
   * @example
   * ```typescript
   * // Render layer to its own image
   * const layerImage = new XCFImage(layer.width, layer.height);
   * layer.makeImage(layerImage);
   * await layerImage.writeImage('./layer.png');
   *
   * // Render layer with offset onto existing canvas
   * const canvas = new XCFImage(1920, 1080);
   * layer.makeImage(canvas, true);
   * await canvas.writeImage('./composited.png');
   * ```
   */
  makeImage(image: IXCFImage, useOffset?: boolean): void {
    if (useOffset && this.isGroup) {
      return;
    }
    if (this.isVisible) {
      let x = 0,
        y = 0;
      const mode = XCFCompositer.makeCompositer(this.mode, this.opacity);
      if (useOffset) {
        x = this.x;
        y = this.y;
      }

      // Select parsers based on XCF version
      const isV11 = this._parent.isV11;
      const hierarchyParserToUse = isV11
        ? hirerarchyParserV11
        : hirerarchyParserV10;
      const levelParserToUse = isV11 ? levelParserV11 : levelParserV10;

      // Get hierarchy pointer (64-bit in v11, 32-bit in v10)
      let hptr: number;
      if (isV11) {
        const details = this._details as ParsedLayer & {
          hptr_high: number;
          hptr_low: number;
        };
        hptr = details.hptr_high * 0x100000000 + details.hptr_low;
      } else {
        hptr = this._details!.hptr;
      }

      const hDetails = hierarchyParserToUse.parse(
        this._parent.getBufferForPointer(hptr),
      ) as ParsedHierarchy & { lptr_high?: number; lptr_low?: number };

      // Get level pointer (64-bit in v11, 32-bit in v10)
      let lptr: number;
      if (isV11) {
        lptr = hDetails.lptr_high! * 0x100000000 + hDetails.lptr_low!;
      } else {
        lptr = hDetails.lptr;
      }

      const levels = levelParserToUse.parse(
        this._parent.getBufferForPointer(lptr),
      ) as ParsedLevel & { tptr64?: Array<{ high: number; low: number }> };

      const tilesAcross = Math.ceil(this.width / 64);

      // Get tile pointers (64-bit array in v11, 32-bit array in v10)
      const tilePointers: number[] = isV11
        ? (levels.tptr64 || []).map(
            (t: { high: number; low: number }) => t.high * 0x100000000 + t.low,
          )
        : levels.tptr || [];

      // Get colormap for indexed images
      const colormap = this._parent.colormap;
      const baseType = this._parent.baseType;
      const bytesPerChannel = this._parent.bytesPerChannel;
      const isFloat = this._parent.isFloatingPoint;

      tilePointers.forEach((tptr: number, index: number) => {
        const xIndex = (index % tilesAcross) * 64;
        const yIndex = Math.floor(index / tilesAcross) * 64;
        const xpoints = Math.min(64, this.width - xIndex);
        const ypoints = Math.min(64, this.height - yIndex);
        this.copyTile(
          image,
          this.uncompress(
            this._parent.getBufferForPointer(tptr),
            xpoints,
            ypoints,
            hDetails.bpp,
          ),
          x + xIndex,
          y + yIndex,
          xpoints,
          ypoints,
          hDetails.bpp,
          mode,
          baseType,
          colormap,
          bytesPerChannel,
          isFloat,
        );
      });
    }
  }

  uncompress(
    compressedData: Buffer,
    xpoints: number,
    ypoints: number,
    bpp: number,
  ): Buffer {
    const size = xpoints * ypoints;
    if (size > 0) {
      const tileBuffer = Buffer.alloc(size * bpp);
      let compressOffset = 0;
      for (let bppLoop = 0; bppLoop < bpp; bppLoop += 1) {
        let currentSize = xpoints * ypoints;
        let offset = bppLoop;

        while (currentSize > 0) {
          const length = compressedData[compressOffset];

          compressOffset += 1;
          if (length < 127) {
            let newLength = length;
            const byte = compressedData[compressOffset];
            compressOffset += 1;
            while (newLength >= 0) {
              tileBuffer[offset] = byte;
              offset += bpp;
              currentSize -= 1;
              newLength -= 1;
            }
          } else if (length === 127) {
            let newLength =
              compressedData[compressOffset] * 256 +
              compressedData[compressOffset + 1];
            compressOffset += 2;
            const byte = compressedData[compressOffset];
            compressOffset += 1;
            while (newLength > 0) {
              tileBuffer[offset] = byte;
              offset += bpp;
              currentSize -= 1;
              newLength -= 1;
            }
          } else if (length === 128) {
            let newLength =
              compressedData[compressOffset] * 256 +
              compressedData[compressOffset + 1];
            compressOffset += 2;

            while (newLength > 0) {
              tileBuffer[offset] = compressedData[compressOffset];
              compressOffset += 1;
              offset += bpp;
              currentSize -= 1;
              newLength -= 1;
            }
          } else {
            let newLength = 256 - length;
            while (newLength > 0) {
              tileBuffer[offset] = compressedData[compressOffset];
              compressOffset += 1;
              offset += bpp;
              currentSize -= 1;
              newLength -= 1;
            }
          }
        }
      }

      return tileBuffer;
    }
    return Buffer.alloc(0);
  }

  /**
   * Read a channel value from the tile buffer and convert to 8-bit (0-255).
   * Handles different precisions: 8-bit, 16-bit, 32-bit integer, and floating point.
   *
   * @param buffer - The tile buffer
   * @param offset - Byte offset in the buffer
   * @param bytesPerChannel - Number of bytes per channel (1, 2, 4, or 8)
   * @param isFloat - Whether the precision is floating point
   * @returns The channel value scaled to 0-255
   */
  private readChannelValue(
    buffer: Buffer,
    offset: number,
    bytesPerChannel: number,
    isFloat: boolean,
  ): number {
    if (bytesPerChannel === 1) {
      // 8-bit integer: direct read
      return buffer[offset];
    } else if (bytesPerChannel === 2) {
      if (isFloat) {
        // 16-bit float: scale from 0.0-1.0 to 0-255
        const floatVal = this.halfToFloat(buffer.readUInt16BE(offset));
        return Math.round(Math.max(0, Math.min(1, floatVal)) * 255);
      } else {
        // 16-bit integer: scale from 0-65535 to 0-255 using integer math (divisor 257)
        const value = buffer.readUInt16BE(offset);
        return (value / 257) | 0;
      }
    } else if (bytesPerChannel === 4) {
      if (isFloat) {
        // 32-bit float: scale from 0.0-1.0 to 0-255
        const floatVal = buffer.readFloatBE(offset);
        return Math.round(Math.max(0, Math.min(1, floatVal)) * 255);
      } else {
        // 32-bit integer: scale from 0-4294967295 to 0-255 using integer math (divisor 16843009)
        const value = buffer.readUInt32BE(offset);
        return (value / 16843009) | 0;
      }
    } else if (bytesPerChannel === 8) {
      // 64-bit double float: scale from 0.0-1.0 to 0-255
      const doubleVal = buffer.readDoubleBE(offset);
      return Math.round(Math.max(0, Math.min(1, doubleVal)) * 255);
    }
    return 0;
  }
  /**
   * Convert IEEE 754 binary16 (half-precision float) to a normal float.
   * @param halfBits - The 16-bit representation
   * @returns The float value
   */
  private halfToFloat(halfBits: number): number {
    const sign = (halfBits >> 15) & 1;
    const exponent = (halfBits >> 10) & 0x1f;
    const fraction = halfBits & 0x3ff;

    if (exponent === 0) {
      // Subnormal or zero
      if (fraction === 0) return sign ? -0 : 0;
      return (sign ? -1 : 1) * Math.pow(2, -14) * (fraction / 1024);
    } else if (exponent === 31) {
      // Infinity or NaN
      return fraction ? NaN : sign ? -Infinity : Infinity;
    }

    return (sign ? -1 : 1) * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
  }

  copyTile(
    image: IXCFImage,
    tileBuffer: Buffer,
    xoffset: number,
    yoffset: number,
    xpoints: number,
    ypoints: number,
    bpp: number,
    mode: CompositerMode | null,
    baseType: XCF_BaseType = XCF_BaseType.RGB,
    colormap: ColorRGB[] | null = null,
    bytesPerChannel: number = 1,
    isFloat: boolean = false,
  ): void {
    const numChannels = bpp / bytesPerChannel;

    // Fast path: 8-bit RGB/RGBA with direct buffer access and no compositing
    if (
      bytesPerChannel === 1 &&
      !isFloat &&
      mode === null &&
      baseType === XCF_BaseType.RGB &&
      image.getDataBuffer
    ) {
      const dataBuffer = image.getDataBuffer() as
        | Uint8Array
        | Uint8ClampedArray;
      const imageWidth = image.width;
      let tileOffset = 0;

      for (let yloop = 0; yloop < ypoints; yloop += 1) {
        const pixelIdx = ((yoffset + yloop) * imageWidth + xoffset) * 4;
        for (let xloop = 0; xloop < xpoints; xloop += 1) {
          const bufIdx = pixelIdx + xloop * 4;
          if (numChannels === 4) {
            // RGBA
            dataBuffer[bufIdx] = tileBuffer[tileOffset];
            dataBuffer[bufIdx + 1] = tileBuffer[tileOffset + 1];
            dataBuffer[bufIdx + 2] = tileBuffer[tileOffset + 2];
            dataBuffer[bufIdx + 3] = tileBuffer[tileOffset + 3];
            tileOffset += 4;
          } else {
            // RGB
            dataBuffer[bufIdx] = tileBuffer[tileOffset];
            dataBuffer[bufIdx + 1] = tileBuffer[tileOffset + 1];
            dataBuffer[bufIdx + 2] = tileBuffer[tileOffset + 2];
            dataBuffer[bufIdx + 3] = 255;
            tileOffset += 3;
          }
        }
      }
      return;
    }

    // Fast path: 16-bit integer RGB/RGBA with direct buffer access and no compositing
    if (
      bytesPerChannel === 2 &&
      !isFloat &&
      mode === null &&
      baseType === XCF_BaseType.RGB &&
      image.getDataBuffer
    ) {
      const dataBuffer = image.getDataBuffer() as
        | Uint8Array
        | Uint8ClampedArray;
      const imageWidth = image.width;
      let tileOffset = 0;

      for (let yloop = 0; yloop < ypoints; yloop += 1) {
        const pixelIdx = ((yoffset + yloop) * imageWidth + xoffset) * 4;
        for (let xloop = 0; xloop < xpoints; xloop += 1) {
          const bufIdx = pixelIdx + xloop * 4;
          // Read 16-bit values and scale to 0-255 using integer math (divisor 257)
          const r = (tileBuffer.readUInt16BE(tileOffset) / 257) | 0;
          const g = (tileBuffer.readUInt16BE(tileOffset + 2) / 257) | 0;
          const b = (tileBuffer.readUInt16BE(tileOffset + 4) / 257) | 0;
          dataBuffer[bufIdx] = r;
          dataBuffer[bufIdx + 1] = g;
          dataBuffer[bufIdx + 2] = b;
          if (numChannels === 4) {
            const a = (tileBuffer.readUInt16BE(tileOffset + 6) / 257) | 0;
            dataBuffer[bufIdx + 3] = a;
            tileOffset += 8;
          } else {
            dataBuffer[bufIdx + 3] = 255;
            tileOffset += 6;
          }
        }
      }
      return;
    }

    // Fast path: 32-bit integer RGB/RGBA with direct buffer access and no compositing
    if (
      bytesPerChannel === 4 &&
      !isFloat &&
      mode === null &&
      baseType === XCF_BaseType.RGB &&
      image.getDataBuffer
    ) {
      const dataBuffer = image.getDataBuffer() as
        | Uint8Array
        | Uint8ClampedArray;
      const imageWidth = image.width;
      let tileOffset = 0;

      for (let yloop = 0; yloop < ypoints; yloop += 1) {
        const pixelIdx = ((yoffset + yloop) * imageWidth + xoffset) * 4;
        for (let xloop = 0; xloop < xpoints; xloop += 1) {
          const bufIdx = pixelIdx + xloop * 4;
          // Read 32-bit values and scale to 0-255 using integer math (divisor 16843009)
          const r = (tileBuffer.readUInt32BE(tileOffset) / 16843009) | 0;
          const g = (tileBuffer.readUInt32BE(tileOffset + 4) / 16843009) | 0;
          const b = (tileBuffer.readUInt32BE(tileOffset + 8) / 16843009) | 0;
          dataBuffer[bufIdx] = r;
          dataBuffer[bufIdx + 1] = g;
          dataBuffer[bufIdx + 2] = b;
          if (numChannels === 4) {
            const a = (tileBuffer.readUInt32BE(tileOffset + 12) / 16843009) | 0;
            dataBuffer[bufIdx + 3] = a;
            tileOffset += 16;
          } else {
            dataBuffer[bufIdx + 3] = 255;
            tileOffset += 12;
          }
        }
      }
      return;
    }

    // General path: handle all other cases
    let bufferOffset = 0;

    for (let yloop = 0; yloop < ypoints; yloop += 1) {
      for (let xloop = 0; xloop < xpoints; xloop += 1) {
        let colour: ColorRGBA;

        if (baseType === XCF_BaseType.INDEXED && colormap) {
          // Indexed: look up color from palette (always 8-bit index)
          const index = tileBuffer[bufferOffset];
          const paletteColor = colormap[index] || { red: 0, green: 0, blue: 0 };
          colour = {
            red: paletteColor.red,
            green: paletteColor.green,
            blue: paletteColor.blue,
            alpha: numChannels === 2 ? tileBuffer[bufferOffset + 1] : 255,
          };
        } else if (numChannels === 1 || numChannels === 2) {
          // Grayscale: convert gray value to RGB
          const gray = this.readChannelValue(
            tileBuffer,
            bufferOffset,
            bytesPerChannel,
            isFloat,
          );
          colour = {
            red: gray,
            green: gray,
            blue: gray,
            alpha:
              numChannels === 2
                ? this.readChannelValue(
                    tileBuffer,
                    bufferOffset + bytesPerChannel,
                    bytesPerChannel,
                    isFloat,
                  )
                : 255,
          };
        } else {
          // RGB/RGBA
          colour = {
            red: this.readChannelValue(
              tileBuffer,
              bufferOffset,
              bytesPerChannel,
              isFloat,
            ),
            green: this.readChannelValue(
              tileBuffer,
              bufferOffset + bytesPerChannel,
              bytesPerChannel,
              isFloat,
            ),
            blue: this.readChannelValue(
              tileBuffer,
              bufferOffset + 2 * bytesPerChannel,
              bytesPerChannel,
              isFloat,
            ),
            alpha:
              numChannels === 4
                ? this.readChannelValue(
                    tileBuffer,
                    bufferOffset + 3 * bytesPerChannel,
                    bytesPerChannel,
                    isFloat,
                  )
                : 255,
          };
        }
        const bgCol = image.getAt(xoffset + xloop, yoffset + yloop);
        const composedColour = mode
          ? (mode.compose(bgCol, colour) as ColorRGBA)
          : colour;
        image.setAt(xoffset + xloop, yoffset + yloop, composedColour);
        bufferOffset += bpp;
      }
    }
  }
}

class GimpChannel {
  private _parent: XCFParser;
  private _buffer: Buffer;
  private _compiled: boolean;

  constructor(parent: XCFParser, buffer: Buffer) {
    this._parent = parent;
    this._buffer = buffer;
    this._compiled = false;
  }
}

/**
 * Main parser for GIMP XCF files.
 *
 * Parses XCF binary data and provides access to image metadata, layers,
 * and rendering capabilities. Use {@link parseFileAsync} to load a file.
 *
 * @example
 * ```typescript
 * import { XCFParser } from 'xcfreader';
 *
 * // Parse and render entire image
 * const parser = await XCFParser.parseFileAsync('./artwork.xcf');
 * console.log(`Image size: ${parser.width}x${parser.height}`);
 * console.log(`Layers: ${parser.layers.length}`);
 *
 * const image = parser.createImage();
 * await image.writeImage('./output.png');
 *
 * // Work with individual layers
 * for (const layer of parser.layers) {
 *   if (layer.isVisible) {
 *     console.log(`${layer.name}: ${layer.width}x${layer.height} at (${layer.x}, ${layer.y})`);
 *   }
 * }
 *
 * // Find specific layer by name
 * const bgLayer = parser.getLayerByName('Background');
 * ```
 */
export class XCFParser {
  private _layers: GimpLayer[] = [];
  private _channels: GimpChannel[] = [];
  private _buffer: Buffer | null = null;
  private _header: ParsedGimpHeader | null = null;
  private _version: number = 0; // XCF version number (e.g., 10, 11)
  private _props: Partial<XCF_PropTypeMap> | null = null;
  _groupLayers: GroupLayerNode = { layer: null, children: [] };

  /**
   * Check if this is an XCF v011+ file (uses 64-bit pointers)
   */
  get isV11(): boolean {
    return this._version >= 11;
  }

  /**
   * Parse an XCF file with callback (legacy API)
   * @param file - Path to the .xcf file
   * @param callback - Callback function (err, parser)
   * @deprecated Use parseFileAsync instead
   */
  static parseFile(
    file: string,
    callback: (err: Error | null, parser?: XCFParser) => void,
  ): void {
    Logger.warn(
      "XCFParser.parseFile() is deprecated. Use parseFileAsync() with async/await instead.",
    );
    XCFParser.parseFileAsync(file)
      .then((parser) => callback(null, parser))
      .catch((err) => callback(err));
  }

  /**
   * Parse an XCF file asynchronously.
   *
   * This is the primary method for loading XCF files. It validates the file
   * exists and contains valid GIMP magic bytes before parsing.
   *
   * @param file - Path to the .xcf file to parse
   * @returns Promise resolving to an XCFParser instance with parsed data
   * @throws {@link XCFParseError} if the file cannot be read or parsed
   * @throws {@link UnsupportedFormatError} if the file is not a valid XCF file
   *
   * @example
   * ```typescript
   * import { XCFParser, XCFParseError } from 'xcfreader';
   *
   * try {
   *   const parser = await XCFParser.parseFileAsync('./artwork.xcf');
   *   console.log(`Loaded: ${parser.width}x${parser.height}, ${parser.layers.length} layers`);
   *
   *   const image = parser.createImage();
   *   await image.writeImage('./output.png');
   * } catch (err) {
   *   if (err instanceof XCFParseError) {
   *     console.error('Failed to parse XCF:', err.message);
   *   }
   * }
   * ```
   */
  static async parseFileAsync(file: string): Promise<XCFParser> {
    try {
      // Validate file exists
      await FS.promises.access(file, FS.constants.R_OK);

      const data = await FS.promises.readFile(file);

      // Validate XCF magic bytes
      if (data.length < 14 || data.toString("utf-8", 0, 4) !== "gimp") {
        throw new UnsupportedFormatError(
          `Invalid XCF file "${file}": missing GIMP magic bytes`,
        );
      }

      const parser = new XCFParser();
      parser.parse(data);
      return parser;
    } catch (err: unknown) {
      if (err instanceof UnsupportedFormatError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new XCFParseError(`Failed to parse XCF file "${file}": ${message}`);
    }
  }

  /**
   * Parse XCF data from a Buffer or ArrayBuffer.
   *
   * This method is useful for browser environments or when you already have
   * the file data in memory. It validates the XCF magic bytes before parsing.
   *
   * @param data - Buffer, ArrayBuffer, or Uint8Array containing XCF file data
   * @returns XCFParser instance with parsed data
   * @throws {@link UnsupportedFormatError} if the data is not a valid XCF file
   *
   * @example
   * ```typescript
   * // Browser: from fetch response
   * const response = await fetch('./artwork.xcf');
   * const arrayBuffer = await response.arrayBuffer();
   * const parser = XCFParser.parseBuffer(arrayBuffer);
   *
   * // Browser: from file input
   * const file = input.files[0];
   * const arrayBuffer = await file.arrayBuffer();
   * const parser = XCFParser.parseBuffer(arrayBuffer);
   *
   * // Node.js: from existing buffer
   * const buffer = fs.readFileSync('./artwork.xcf');
   * const parser = XCFParser.parseBuffer(buffer);
   * ```
   */
  static parseBuffer(data: Buffer | ArrayBuffer | Uint8Array): XCFParser {
    // Convert to Buffer if needed
    let buffer: Buffer;
    if (data instanceof Buffer) {
      buffer = data;
    } else if (data instanceof ArrayBuffer) {
      buffer = Buffer.from(data);
    } else if (data instanceof Uint8Array) {
      buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    } else {
      throw new XCFParseError(
        "Invalid input: expected Buffer, ArrayBuffer, or Uint8Array",
      );
    }

    // Validate XCF magic bytes
    if (buffer.length < 14 || buffer.toString("utf-8", 0, 4) !== "gimp") {
      throw new UnsupportedFormatError(
        "Invalid XCF data: missing GIMP magic bytes",
      );
    }

    const parser = new XCFParser();
    parser.parse(buffer);
    return parser;
  }

  parse(buffer: Buffer): void {
    this._buffer = buffer;
    this._layers = [];
    this._channels = [];
    this._groupLayers = { layer: null, children: [] };

    // Detect XCF version to choose correct parser
    const version = buffer.toString("utf-8", 9, 13);
    const versionNum = parseInt(version.replace("v", ""), 10);
    this._version = versionNum;

    let layerPointers: number[];

    if (versionNum >= 11) {
      // XCF v011+ uses 64-bit pointers and has precision field
      const header = gimpHeaderV11.parse(buffer) as ParsedGimpHeader & {
        layerList64?: Array<{ high: number; low: number }>;
        channelList64?: Array<{ high: number; low: number }>;
      };
      this._header = header;

      // Convert 64-bit pointers to numbers (JavaScript can handle up to 2^53)
      layerPointers = (header.layerList64 || [])
        .filter((p) => p.high !== 0 || p.low !== 0)
        .map((p) => p.high * 0x100000000 + p.low);
    } else {
      // XCF v010 and earlier use 32-bit pointers
      this._header = gimpHeaderV10.parse(buffer) as ParsedGimpHeader;
      layerPointers = (this._header.layerList || []).filter(remove_empty);
    }

    this._layers = layerPointers.map((layerPointer: number) => {
      const layer = new GimpLayer(this, this._buffer!.slice(layerPointer));
      const path = layer.pathInfo;
      if (!path) {
        this._groupLayers.children.push({
          layer: layer as unknown as import("./types/index.js").GimpLayerPublic,
          children: [],
        });
      } else {
        const pathData = path.data as unknown as ParsedPropItemPath;
        const toCall = (
          node: GroupLayerNode,
          index: number,
        ): GroupLayerNode => {
          if (index === pathData.items.length) {
            node.layer =
              layer as unknown as import("./types/index.js").GimpLayerPublic;
          } else {
            if (isUnset(node.children[pathData.items[index]])) {
              node.children[pathData.items[index]] = {
                layer: null,
                children: [],
              };
            }
            node.children[pathData.items[index]] = toCall(
              node.children[pathData.items[index]],
              index + 1,
            );
          }

          return node;
        };

        this._groupLayers = toCall(this._groupLayers, 0);
      }
      return layer;
    });

    // Note: Channel parsing for v011 would need similar 64-bit handling
    // Currently only supporting layer parsing for v011
    this._channels = (this._header.channelList || [])
      .filter(remove_empty)
      .map((channelPointer: number) => {
        return new GimpChannel(this, this._buffer!.slice(channelPointer));
      });
  }

  getBufferForPointer(offset: number): Buffer {
    return this._buffer!.slice(offset);
  }

  get width(): number {
    return this._header!.width;
  }

  get height(): number {
    return this._header!.height;
  }

  /**
   * The base color type of the image.
   *
   * @returns The base type (RGB, Grayscale, or Indexed)
   *
   * @example
   * ```typescript
   * import { XCFParser, XCF_BaseType } from 'xcfreader';
   *
   * const parser = await XCFParser.parseFileAsync('./image.xcf');
   * if (parser.baseType === XCF_BaseType.GRAYSCALE) {
   *   console.log('This is a grayscale image');
   * }
   * ```
   */
  get baseType(): XCF_BaseType {
    return this._header!.base_type as XCF_BaseType;
  }

  /**
   * The image precision (bit depth and format).
   *
   * Returns the precision value from the XCF header. For XCF v3 and earlier,
   * the precision is always 8-bit gamma integer (150).
   *
   * @returns The precision value (see XCF_Precision enum)
   *
   * @example
   * ```typescript
   * import { XCFParser, XCF_Precision } from 'xcfreader';
   *
   * const parser = await XCFParser.parseFileAsync('./image.xcf');
   * if (parser.precision === XCF_Precision.U32_GAMMA) {
   *   console.log('This is a 32-bit gamma integer image');
   * }
   * ```
   */
  get precision(): XCF_Precision {
    // XCF v3 and earlier don't have precision field, default to 8-bit gamma
    if (this._version < 4 || this._header!.precision === undefined) {
      return XCF_Precision.U8_GAMMA;
    }
    return this._header!.precision as XCF_Precision;
  }

  /**
   * Get the number of bytes per channel for the current precision.
   * @returns Number of bytes per color channel (1, 2, 4, or 8)
   */
  get bytesPerChannel(): number {
    const precision = this.precision;
    // Precision values: 100-150 = 8-bit, 200-250 = 16-bit, 300-350 = 32-bit int,
    // 500-550 = 16-bit float (half), 600-650 = 32-bit float, 700-750 = 64-bit float
    if (precision >= 700) return 8; // 64-bit double
    if (precision >= 600) return 4; // 32-bit float
    if (precision >= 500) return 2; // 16-bit half float
    if (precision >= 300) return 4; // 32-bit integer
    if (precision >= 200) return 2; // 16-bit integer
    return 1; // 8-bit integer
  }

  /**
   * Check if the image uses floating point precision.
   * @returns True if the image uses floating point values
   */
  get isFloatingPoint(): boolean {
    const precision = this.precision;
    return precision >= 500; // 500+ are floating point formats
  }

  /**
   * Get a property from the image header's property list.
   *
   * @typeParam T - The property type (inferred from prop parameter)
   * @param prop - The property type to retrieve (from XCF_PropType enum)
   * @param index - Optional sub-field to extract from the property data
   * @returns The property value, a specific field value if index is provided, or null if not found
   */
  getProps<T extends XCF_PropType>(
    prop: T,
    index?: string,
  ): XCF_PropTypeMap[T] | number | null {
    if (!this._props) {
      this._props = {};
      (this._header!.propertyList || []).forEach((property: ParsedProperty) => {
        (this._props as unknown as Record<XCF_PropType, ParsedProperty>)[
          property.type
        ] = property;
      });
    }

    const propValue = this._props[prop];
    if (index && propValue && "data" in propValue) {
      return (propValue.data as Record<string, number>)[index];
    }
    return propValue ?? null;
  }

  /**
   * The color palette for indexed color images.
   *
   * Returns an array of RGB color objects if this is an indexed color image,
   * or null for RGB/Grayscale images.
   *
   * @returns Array of RGB colors, or null if not an indexed image
   *
   * @example
   * ```typescript
   * import { XCFParser, XCF_BaseType } from 'xcfreader';
   *
   * const parser = await XCFParser.parseFileAsync('./indexed.xcf');
   * if (parser.baseType === XCF_BaseType.INDEXED && parser.colormap) {
   *   console.log(`Palette has ${parser.colormap.length} colors`);
   *   parser.colormap.forEach((color, i) => {
   *     console.log(`Color ${i}: rgb(${color.red}, ${color.green}, ${color.blue})`);
   *   });
   * }
   * ```
   */
  get colormap(): ColorRGB[] | null {
    if (this._header!.base_type !== XCF_BaseType.INDEXED) {
      return null;
    }
    const colormapProp = this.getProps(XCF_PropType.COLORMAP);
    if (
      colormapProp &&
      typeof colormapProp === "object" &&
      "data" in colormapProp
    ) {
      const data = colormapProp.data as { colours: ParsedRGB[] };
      return data.colours.map((c: ParsedRGB) => ({
        red: c.red,
        green: c.greed, // Note: typo in parser "greed" instead of "green"
        blue: c.blue,
      }));
    }
    return null;
  }

  get layers(): GimpLayer[] {
    return this._layers;
  }

  get groupLayers(): GroupLayerNode {
    if (isUnset(this._groupLayers)) {
      this._groupLayers = { layer: null, children: [] };
      (this.layers || []).forEach((layer) => {
        const segments = layer.groupName.split("/");
        let cursor = this._groupLayers;

        for (let i = 0; i < segments.length - 1; ++i) {
          const segmentKey = segments[i];
          const cursorChildren = cursor.children as unknown as Record<
            string,
            GroupLayerNode
          >;
          cursorChildren[segmentKey] = cursorChildren[segmentKey] || {
            layer: null,
            children: [],
          };
          cursorChildren[segmentKey].children =
            cursorChildren[segmentKey].children || [];
          cursor = cursorChildren[segmentKey];
        }
        const lastSegment = segments[segments.length - 1];
        const cursorChildren = cursor.children as unknown as Record<
          string,
          GroupLayerNode
        >;
        cursorChildren[lastSegment] = cursorChildren[lastSegment] || {
          layer: null,
          children: [],
        };
        cursorChildren[lastSegment].layer =
          layer as unknown as import("./types/index.js").GimpLayerPublic;
      });
    }
    return this._groupLayers;
  }

  /**
   * Find a layer by its name.
   *
   * Searches through all layers and returns the first one matching the given name.
   * Layer names in GIMP may have suffixes like " copy" or " #1" which are automatically
   * stripped when comparing.
   *
   * @param name - The name of the layer to find
   * @returns The matching GimpLayer, or undefined if not found
   *
   * @example
   * ```typescript
   * const bgLayer = parser.getLayerByName('Background');
   * if (bgLayer) {
   *   console.log(`Background opacity: ${bgLayer.opacity}`);
   *   const bgImage = bgLayer.makeImage();
   *   await bgImage.writeImage('./background.png');
   * }
   * ```
   */
  getLayerByName(name: string): GimpLayer | undefined {
    return this.layers.find((layer) => layer.name === name);
  }

  /**
   * Create a flattened image by compositing all visible layers.
   *
   * Iterates through layers in reverse order (bottom to top) and composites
   * each visible layer using its blend mode, opacity, and position settings.
   *
   * @param image - The XCFImage to render onto. Create one with `new XCFImage(parser.width, parser.height)`.
   * @returns The composited XCFImage with all visible layers flattened
   *
   * @example
   * ```typescript
   * // Create flattened image from all visible layers
   * const parser = await XCFParser.parseFileAsync('./artwork.xcf');
   * const image = new XCFImage(parser.width, parser.height);
   * parser.createImage(image);
   * await image.writeImage('./flattened.png');
   *
   * // Composite onto a custom canvas with white background
   * const canvas = new XCFImage(1920, 1080);
   * canvas.fillRect(0, 0, 1920, 1080, { red: 255, green: 255, blue: 255, alpha: 255 });
   * parser.createImage(canvas);
   * await canvas.writeImage('./on-white-bg.png');
   * ```
   */
  createImage(image: IXCFImage): IXCFImage {
    const resultImage: IXCFImage = image;

    (this.layers || [])
      .slice()
      .reverse()
      .forEach((layer) => {
        layer.makeImage(resultImage, true);
      });
    return resultImage;
  }

  /**
   * Create a flattened image by compositing only specific layers.
   *
   * Unlike {@link createImage} which renders all visible layers, this method
   * allows you to specify exactly which layers to include. Layers are rendered
   * in the order specified (first layer is at the bottom).
   *
   * @param image - The IXCFImage to render onto
   * @param layerNames - Array of layer names to include (case-sensitive)
   * @param options - Optional settings
   * @param options.ignoreVisibility - If true, render layers even if they are hidden (default: false)
   * @returns The composited IXCFImage with the specified layers
   *
   * @example
   * ```typescript
   * // Render only specific layers
   * const parser = await XCFParser.parseFileAsync('./artwork.xcf');
   * const image = new XCFPNGImage(parser.width, parser.height);
   * parser.createImageFromLayers(image, ['background', 'character', 'foreground']);
   * await image.writeImage('./selected-layers.png');
   *
   * // Render hidden layers (useful for exporting variants)
   * parser.createImageFromLayers(image, ['background', 'variant-b'], { ignoreVisibility: true });
   * ```
   */
  createImageFromLayers(
    image: IXCFImage,
    layerNames: string[],
    options?: { ignoreVisibility?: boolean },
  ): IXCFImage {
    const ignoreVisibility = options?.ignoreVisibility ?? false;

    // Find layers by name and preserve the order specified
    const layersToRender: GimpLayer[] = [];
    for (const name of layerNames) {
      const layer = this.layers.find((l) => l.name === name);
      if (layer) {
        layersToRender.push(layer);
      }
    }

    // Render in order (first layer is at the bottom)
    layersToRender.forEach((layer) => {
      if (ignoreVisibility || layer.isVisible) {
        layer.makeImage(image, true);
      }
    });

    return image;
  }
}
