/**
 * xcfreader - Parse and render GIMP XCF files
 * Copyright (c) 2026 Andi McLean
 * Licensed under the MIT License
 * https://github.com/andimclean/xcfreader
 */

import { Logger } from "./lib/logger.js";
import XCFCompositer from "./lib/xcfcompositer.js";
import { XCFValidator, XCFValidationError, ValidationOptions } from "./lib/xcf-validator.js";
import { BinaryReader } from "./lib/binary-reader.js";
import {
  parseGimpHeaderV10,
  parseGimpHeaderV11,
  parseLayerV10,
  parseLayerV11,
  parseHierarchyV10,
  parseHierarchyV11,
  parseLevelV10,
  parseLevelV11,
  parseFullParasiteArray,
  offset64ToNumber,
  type ParsedLayerV10,
  type ParsedLayerV11,
  type ParsedHierarchyV10,
  type ParsedHierarchyV11,
  type ParsedLevelV10,
  type ParsedLevelV11,
} from "./lib/xcf-parsers.js";
import {
  XCF_PropType,
  XCF_PropTypeMap,
  XCF_BaseType,
  XCF_Precision,
  ColorRGB,
  ColorRGBA,
  IXCFImage,
  ParsedLayer,
  ParsedGimpHeader,
  ParsedProperty,
  ParsedParasiteItem,
  ParsedPropItemPath,
  ParsedRGB,
  CompositerMode,
  GroupLayerNode,
} from "./types/index.js";

// Re-export all types for consumers
export * from "./types/index.js";
export { XCFValidator, XCFValidationError } from "./lib/xcf-validator.js";
export type { ValidationOptions } from "./lib/xcf-validator.js";

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

// All parsers now imported from xcf-parsers.ts

const remove_empty = (data: number): boolean => {
  return data !== 0;
};

const isUnset = (value: unknown): boolean => {
  return value === null || value === undefined;
};

/**
 * Type guard to check if a property has a data field
 */
const hasDataField = <T>(prop: unknown): prop is { data: T } => {
  return prop !== null && typeof prop === "object" && "data" in prop;
};

/**
 * Safely extract data from a property value
 */
const getPropertyData = <T>(propValue: unknown): T | null => {
  if (hasDataField<T>(propValue)) {
    return propValue.data;
  }
  return null;
};

/**
 * Safely get a field from property data
 */
const getPropertyField = <T>(propValue: unknown, field: string): T | null => {
  const data = getPropertyData<Record<string, T>>(propValue);
  return data?.[field] ?? null;
};

/**
 * Convert internal GimpLayer to public API type.
 * This is necessary because GimpLayer is an internal class but needs to be
 * exposed through the public API as GimpLayerPublic interface.
 */
const toPublicLayer = (layer: GimpLayer): import("./types/index.js").GimpLayerPublic => {
  return layer as unknown as import("./types/index.js").GimpLayerPublic;
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
/**
 * @internal
 */
class GimpLayer {
  private _parent: XCFParser;
  private _buffer: Uint8Array;
  private _compiled: boolean;
  private _props: Partial<XCF_PropTypeMap> | null;
  private _details: ParsedLayer | null;
  private _name?: string;
  private _parasites?: Record<string, Record<string, string>>;

  constructor(parent: XCFParser, buffer: Uint8Array) {
    this._parent = parent;
    this._buffer = buffer;
    this._compiled = false;
    this._props = null;
    this._details = null;
  }

  compile(): void {
    const reader = new BinaryReader(this._buffer);
    this._details = (
      this._parent.isV11 ? parseLayerV11(reader) : parseLayerV10(reader)
    ) as ParsedLayer;
    this._compiled = true;

    // Validate layer dimensions after compilation
    this._parent._validateLayerDimensions(
      this._details.width,
      this._details.height,
      this.x,
      this.y,
      this._details.name || "unknown"
    );
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
    return this.getProps(XCF_PropType.ITEM_PATH) as ParsedProperty | null;
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

    const pathData = getPropertyData<ParsedPropItemPath>(pathInfo);
    if (!pathData) {
      return this.name;
    }

    const pathItems = pathData.items;
    let item: GroupLayerNode = this._parent._groupLayers;
    const name: string[] = [];
    for (let index = 0; index < pathItems.length; index += 1) {
      item = item.children[pathItems[index]!]!; // Safe: index < length, children exist
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
    return (this.getProps(XCF_PropType.OFFSETS, "dx") as number) || 0;
  }

  /**
   * Get the Y offset of this layer
   */
  get y(): number {
    return (this.getProps(XCF_PropType.OFFSETS, "dy") as number) || 0;
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
      const parasite = this.getProps(XCF_PropType.PARASITES) as ParsedProperty | null;
      this._parasites = {};
      if (parasite) {
        const parasiteBuffer = getPropertyData<{ parasite: Uint8Array }>(parasite);
        if (parasiteBuffer?.parasite) {
          const parasiteItems = parseFullParasiteArray(parasiteBuffer.parasite);
          parasiteItems.forEach((parasiteItem: ParsedParasiteItem) => {
            const parasiteName = parasiteItem.name;
            if (parasiteName === "gimp-text-layer") {
              const detailsReader = new BinaryReader(parasiteItem.details);
              const text = detailsReader.readZeroTerminatedString();
              const fields: Record<string, string> = {};
              const matches = text.match(/(\(.*\))+/g) || [];
              matches.forEach((item: string) => {
                const itemParts = item.substring(1, item.length - 1).split(" ");
                const key = itemParts[0]!; // Safe: split always returns at least one element
                const value = itemParts.slice(1).join(" ");
                fields[key] = value.replace(/^["]+/, "").replace(/["]+$/, "");
              });
              this._parasites![parasiteName] = fields;
            }
          });
        }
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
  getProps<T extends XCF_PropType>(prop: T, index?: string): XCF_PropTypeMap[T] | number | null {
    if (!this._compiled) {
      this.compile();
    }

    if (!this._props) {
      this._props = {};
      (this._details!.propertyList || []).forEach((property: ParsedProperty) => {
        // Type assertion needed: ParsedProperty is a union that gets narrowed by property.type
        this._props![property.type as T] = property as unknown as XCF_PropTypeMap[T];
      });
    }

    const propValue = this._props[prop];
    if (index) {
      return getPropertyField<number>(propValue, index);
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

      // Get hierarchy pointer (64-bit in v11, 32-bit in v10)
      let hptr: number;
      if (isV11) {
        const details = this._details as unknown as ParsedLayerV11;
        hptr = details.hptr_high * 0x100000000 + details.hptr_low;
      } else {
        const details = this._details as unknown as ParsedLayerV10;
        hptr = details.hptr;
      }

      const hReader = new BinaryReader(this._parent.getBufferForPointer(hptr));
      const hDetails = isV11 ? parseHierarchyV11(hReader) : parseHierarchyV10(hReader);

      // Get level pointer (64-bit in v11, 32-bit in v10)
      let lptr: number;
      if (isV11) {
        const h11 = hDetails as ParsedHierarchyV11;
        lptr = h11.lptr_high * 0x100000000 + h11.lptr_low;
      } else {
        const h10 = hDetails as ParsedHierarchyV10;
        lptr = h10.lptr;
      }

      const lReader = new BinaryReader(this._parent.getBufferForPointer(lptr));
      const levels = isV11 ? parseLevelV11(lReader) : parseLevelV10(lReader);

      const tilesAcross = Math.ceil(this.width / 64);

      // Get tile pointers (64-bit array in v11, 32-bit array in v10)
      const tilePointers: number[] = isV11
        ? (levels as ParsedLevelV11).tptr64.map((t) => offset64ToNumber(t))
        : (levels as ParsedLevelV10).tptr;

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
          this.uncompress(this._parent.getBufferForPointer(tptr), xpoints, ypoints, hDetails.bpp),
          x + xIndex,
          y + yIndex,
          xpoints,
          ypoints,
          hDetails.bpp,
          mode,
          baseType,
          colormap,
          bytesPerChannel,
          isFloat
        );
      });
    }
  }

  uncompress(
    compressedData: Uint8Array,
    xpoints: number,
    ypoints: number,
    bpp: number
  ): Uint8Array {
    const size = xpoints * ypoints;
    if (size > 0) {
      const tileBuffer = new Uint8Array(size * bpp);
      let compressOffset = 0;
      for (let bppLoop = 0; bppLoop < bpp; bppLoop += 1) {
        let currentSize = xpoints * ypoints;
        let offset = bppLoop;

        while (currentSize > 0) {
          const length = compressedData[compressOffset]!;

          compressOffset += 1;
          if (length < 127) {
            let newLength = length;
            const byte = compressedData[compressOffset]!;
            compressOffset += 1;
            while (newLength >= 0) {
              tileBuffer[offset] = byte;
              offset += bpp;
              currentSize -= 1;
              newLength -= 1;
            }
          } else if (length === 127) {
            let newLength =
              compressedData[compressOffset]! * 256 + compressedData[compressOffset + 1]!;
            compressOffset += 2;
            const byte = compressedData[compressOffset]!;
            compressOffset += 1;
            while (newLength > 0) {
              tileBuffer[offset] = byte;
              offset += bpp;
              currentSize -= 1;
              newLength -= 1;
            }
          } else if (length === 128) {
            let newLength =
              compressedData[compressOffset]! * 256 + compressedData[compressOffset + 1]!;
            compressOffset += 2;

            while (newLength > 0) {
              tileBuffer[offset] = compressedData[compressOffset]!;
              compressOffset += 1;
              offset += bpp;
              currentSize -= 1;
              newLength -= 1;
            }
          } else {
            let newLength = 256 - length;
            while (newLength > 0) {
              tileBuffer[offset] = compressedData[compressOffset]!;
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
    return new Uint8Array(0);
  }

  /**
   * Read a channel value from the tile buffer and convert to 8-bit (0-255).
   * Handles different precisions: 8-bit, 16-bit, 32-bit integer, and floating point.
   *
   * @param buffer - The tile buffer
   * @param view - Reusable DataView for the buffer (for performance)
   * @param offset - Byte offset in the buffer
   * @param bytesPerChannel - Number of bytes per channel (1, 2, 4, or 8)
   * @param isFloat - Whether the precision is floating point
   * @returns The channel value scaled to 0-255
   */
  private readChannelValue(
    buffer: Uint8Array,
    view: DataView,
    offset: number,
    bytesPerChannel: number,
    isFloat: boolean
  ): number {
    if (bytesPerChannel === 1) {
      // 8-bit integer: direct read
      return buffer[offset]!;
    } else if (bytesPerChannel === 2) {
      if (isFloat) {
        // 16-bit float: scale from 0.0-1.0 to 0-255
        const floatVal = this.halfToFloat(view.getUint16(offset, false));
        return Math.round(Math.max(0, Math.min(1, floatVal)) * 255);
      } else {
        // 16-bit integer: scale from 0-65535 to 0-255 using integer math (divisor 257)
        const value = view.getUint16(offset, false);
        return (value / 257) | 0;
      }
    } else if (bytesPerChannel === 4) {
      if (isFloat) {
        // 32-bit float: scale from 0.0-1.0 to 0-255
        const floatVal = view.getFloat32(offset, false);
        return Math.round(Math.max(0, Math.min(1, floatVal)) * 255);
      } else {
        // 32-bit integer: scale from 0-4294967295 to 0-255 using integer math (divisor 16843009)
        const value = view.getUint32(offset, false);
        return (value / 16843009) | 0;
      }
    } else if (bytesPerChannel === 8) {
      // 64-bit double float: scale from 0.0-1.0 to 0-255
      const doubleVal = view.getFloat64(offset, false);
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
    tileBuffer: Uint8Array,
    xoffset: number,
    yoffset: number,
    xpoints: number,
    ypoints: number,
    bpp: number,
    mode: CompositerMode | null,
    baseType: XCF_BaseType = XCF_BaseType.RGB,
    colormap: ColorRGB[] | null = null,
    bytesPerChannel: number = 1,
    isFloat: boolean = false
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
      const dataBuffer = image.getDataBuffer() as Uint8Array | Uint8ClampedArray;
      const imageWidth = image.width;
      let tileOffset = 0;

      for (let yloop = 0; yloop < ypoints; yloop += 1) {
        const pixelIdx = ((yoffset + yloop) * imageWidth + xoffset) * 4;
        for (let xloop = 0; xloop < xpoints; xloop += 1) {
          const bufIdx = pixelIdx + xloop * 4;
          if (numChannels === 4) {
            // RGBA
            dataBuffer[bufIdx] = tileBuffer[tileOffset]!;
            dataBuffer[bufIdx + 1] = tileBuffer[tileOffset + 1]!;
            dataBuffer[bufIdx + 2] = tileBuffer[tileOffset + 2]!;
            dataBuffer[bufIdx + 3] = tileBuffer[tileOffset + 3]!;
            tileOffset += 4;
          } else {
            // RGB
            dataBuffer[bufIdx] = tileBuffer[tileOffset]!;
            dataBuffer[bufIdx + 1] = tileBuffer[tileOffset + 1]!;
            dataBuffer[bufIdx + 2] = tileBuffer[tileOffset + 2]!;
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
      const dataBuffer = image.getDataBuffer() as Uint8Array | Uint8ClampedArray;
      const imageWidth = image.width;
      let tileOffset = 0;
      const tileView = new DataView(
        tileBuffer.buffer,
        tileBuffer.byteOffset,
        tileBuffer.byteLength
      );

      for (let yloop = 0; yloop < ypoints; yloop += 1) {
        const pixelIdx = ((yoffset + yloop) * imageWidth + xoffset) * 4;
        for (let xloop = 0; xloop < xpoints; xloop += 1) {
          const bufIdx = pixelIdx + xloop * 4;
          // Read 16-bit values and scale to 0-255 using integer math (divisor 257)
          const r = (tileView.getUint16(tileOffset, false) / 257) | 0;
          const g = (tileView.getUint16(tileOffset + 2, false) / 257) | 0;
          const b = (tileView.getUint16(tileOffset + 4, false) / 257) | 0;
          dataBuffer[bufIdx] = r;
          dataBuffer[bufIdx + 1] = g;
          dataBuffer[bufIdx + 2] = b;
          if (numChannels === 4) {
            const a = (tileView.getUint16(tileOffset + 6, false) / 257) | 0;
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
      const dataBuffer = image.getDataBuffer() as Uint8Array | Uint8ClampedArray;
      const imageWidth = image.width;
      let tileOffset = 0;
      const tileView = new DataView(
        tileBuffer.buffer,
        tileBuffer.byteOffset,
        tileBuffer.byteLength
      );

      for (let yloop = 0; yloop < ypoints; yloop += 1) {
        const pixelIdx = ((yoffset + yloop) * imageWidth + xoffset) * 4;
        for (let xloop = 0; xloop < xpoints; xloop += 1) {
          const bufIdx = pixelIdx + xloop * 4;
          // Read 32-bit values and scale to 0-255 using integer math (divisor 16843009)
          const r = (tileView.getUint32(tileOffset, false) / 16843009) | 0;
          const g = (tileView.getUint32(tileOffset + 4, false) / 16843009) | 0;
          const b = (tileView.getUint32(tileOffset + 8, false) / 16843009) | 0;
          dataBuffer[bufIdx] = r;
          dataBuffer[bufIdx + 1] = g;
          dataBuffer[bufIdx + 2] = b;
          if (numChannels === 4) {
            const a = (tileView.getUint32(tileOffset + 12, false) / 16843009) | 0;
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
    // Create a single DataView for the tile buffer to avoid creating millions of DataView objects
    const tileView = new DataView(tileBuffer.buffer, tileBuffer.byteOffset, tileBuffer.byteLength);

    for (let yloop = 0; yloop < ypoints; yloop += 1) {
      for (let xloop = 0; xloop < xpoints; xloop += 1) {
        let colour: ColorRGBA;

        if (baseType === XCF_BaseType.INDEXED && colormap) {
          // Indexed: look up color from palette (always 8-bit index)
          const index = tileBuffer[bufferOffset]!;
          const paletteColor = colormap[index] || { red: 0, green: 0, blue: 0 };
          colour = {
            red: paletteColor.red,
            green: paletteColor.green,
            blue: paletteColor.blue,
            alpha: numChannels === 2 ? tileBuffer[bufferOffset + 1]! : 255,
          };
        } else if (numChannels === 1 || numChannels === 2) {
          // Grayscale: convert gray value to RGB
          const gray = this.readChannelValue(
            tileBuffer,
            tileView,
            bufferOffset,
            bytesPerChannel,
            isFloat
          );
          colour = {
            red: gray,
            green: gray,
            blue: gray,
            alpha:
              numChannels === 2
                ? this.readChannelValue(
                    tileBuffer,
                    tileView,
                    bufferOffset + bytesPerChannel,
                    bytesPerChannel,
                    isFloat
                  )
                : 255,
          };
        } else {
          // RGB/RGBA
          colour = {
            red: this.readChannelValue(
              tileBuffer,
              tileView,
              bufferOffset,
              bytesPerChannel,
              isFloat
            ),
            green: this.readChannelValue(
              tileBuffer,
              tileView,
              bufferOffset + bytesPerChannel,
              bytesPerChannel,
              isFloat
            ),
            blue: this.readChannelValue(
              tileBuffer,
              tileView,
              bufferOffset + 2 * bytesPerChannel,
              bytesPerChannel,
              isFloat
            ),
            alpha:
              numChannels === 4
                ? this.readChannelValue(
                    tileBuffer,
                    tileView,
                    bufferOffset + 3 * bytesPerChannel,
                    bytesPerChannel,
                    isFloat
                  )
                : 255,
          };
        }
        const bgCol = image.getAt(xoffset + xloop, yoffset + yloop);
        const composedColour = mode ? (mode.compose(bgCol, colour) as ColorRGBA) : colour;
        image.setAt(xoffset + xloop, yoffset + yloop, composedColour);
        bufferOffset += bpp;
      }
    }
  }
}

/**
 * @internal
 */
class GimpChannel {
  private _parent: XCFParser;
  private _buffer: Uint8Array;
  private _compiled: boolean;

  constructor(parent: XCFParser, buffer: Uint8Array) {
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
  private _buffer: Uint8Array | null = null;
  private _header: ParsedGimpHeader | null = null;
  private _version: number = 0; // XCF version number (e.g., 10, 11)
  private _props: Partial<XCF_PropTypeMap> | null = null;
  _groupLayers: GroupLayerNode = { layer: null, children: [] };
  private _validator: XCFValidator;

  /**
   * Create a new XCFParser instance
   * @param validationOptions - Optional validation configuration
   */
  constructor(validationOptions?: ValidationOptions) {
    this._validator = new XCFValidator(validationOptions);
  }

  /**
   * Check if this is an XCF v011+ file (uses 64-bit pointers)
   */
  get isV11(): boolean {
    return this._version >= 11;
  }

  /**
   * Validate layer dimensions (internal use by GimpLayer)
   * @internal
   */
  _validateLayerDimensions(
    width: number,
    height: number,
    offsetX: number,
    offsetY: number,
    layerName: string
  ): void {
    this._validator.validateLayerDimensions(width, height, offsetX, offsetY, layerName);
  }

  /**
   * Parse an XCF file with callback (legacy API)
   * @param file - Path to the .xcf file
   * @param callback - Callback function (err, parser)
   * @deprecated Use parseFileAsync instead
   */
  static parseFile(file: string, callback: (err: Error | null, parser?: XCFParser) => void): void {
    Logger.warn(
      "XCFParser.parseFile() is deprecated. Use parseFileAsync() with async/await instead."
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
      // Dynamically import fs (Node.js only)
      const FS = await import("fs");

      // Validate file exists
      await FS.promises.access(file, FS.constants.R_OK);

      const data = await FS.promises.readFile(file);

      const parser = new XCFParser();

      // Validate XCF header and magic bytes
      try {
        parser._validator.validateHeader(data);
      } catch (err) {
        if (err instanceof XCFValidationError) {
          throw new UnsupportedFormatError(
            `Invalid XCF file "${file}": ${err.message}\n` +
              `This file does not appear to be a valid GIMP XCF file.\n` +
              `Possible causes: wrong file type, file is corrupt, or not saved from GIMP.\n` +
              `Please verify the file and try exporting from GIMP again.`
          );
        }
        throw err;
      }

      parser.parse(data);
      return parser;
    } catch (err: unknown) {
      if (err instanceof UnsupportedFormatError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new XCFParseError(
        `Failed to parse XCF file "${file}": ${message}\n` +
          `This may be due to file corruption, unsupported features, or an invalid file format.\n` +
          `If this is a valid XCF file, please report this issue with the file details.`
      );
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
  static parseBuffer(data: ArrayBuffer | Uint8Array): XCFParser {
    // BinaryReader accepts ArrayBuffer or Uint8Array directly
    // (Node.js Buffer extends Uint8Array, so it works automatically!)

    const parser = new XCFParser();

    // Validate XCF header and magic bytes
    try {
      parser._validator.validateHeader(data);
    } catch (err) {
      if (err instanceof XCFValidationError) {
        throw new UnsupportedFormatError(
          `Invalid XCF data: ${err.message}\n` +
            "This does not appear to be a valid GIMP XCF file.\n" +
            "Possible causes: wrong file type, file is corrupt, or not saved from GIMP.\n" +
            "Please verify the file and try exporting from GIMP again."
        );
      }
      throw err;
    }

    parser.parse(data);
    return parser;
  }

  parse(buffer: ArrayBuffer | Uint8Array): void {
    // Convert ArrayBuffer to Uint8Array if needed
    const uint8Buffer = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    this._buffer = uint8Buffer;
    this._layers = [];
    this._channels = [];
    this._groupLayers = { layer: null, children: [] };

    // Reset validator state for new parse
    this._validator.reset();

    // Detect XCF version to choose correct parser (bytes 9-13 contain version string)
    const versionBytes = uint8Buffer.subarray(9, 13);
    const version = new TextDecoder("utf-8").decode(versionBytes);
    const versionNum = parseInt(version.replace("v", ""), 10);
    this._version = versionNum;

    let layerPointers: number[];

    if (versionNum >= 11) {
      // XCF v011+ uses 64-bit pointers and has precision field
      const header = parseGimpHeaderV11(uint8Buffer);
      this._header = header as unknown as ParsedGimpHeader;

      // Validate image dimensions and base type
      this._validator.validateImageDimensions(header.width, header.height);
      this._validator.validateBaseType(header.base_type);

      // Convert 64-bit pointers to numbers (JavaScript can handle up to 2^53)
      layerPointers = header.layerList64
        .filter((p) => p.high !== 0 || p.low !== 0)
        .map((p) => offset64ToNumber(p));
    } else {
      // XCF v010 and earlier use 32-bit pointers
      const header = parseGimpHeaderV10(uint8Buffer);
      this._header = header as unknown as ParsedGimpHeader;

      // Validate image dimensions and base type
      this._validator.validateImageDimensions(header.width, header.height);
      this._validator.validateBaseType(header.base_type);

      layerPointers = header.layerList.filter((p) => p !== 0);
    }

    // Validate layer pointers are within bounds
    this._validator.validatePointers(layerPointers, uint8Buffer, "layer pointer");

    /**
     * Layer Hierarchy Construction
     *
     * XCF files support layer groups (folders) which create a hierarchical structure.
     * Each layer can have an optional ITEM_PATH property that indicates its position
     * in the hierarchy.
     *
     * - Layers WITHOUT an ITEM_PATH are root-level layers (not in any group)
     * - Layers WITH an ITEM_PATH have a path like [0], [0, 1], [0, 1, 2] indicating
     *   their position in nested groups
     *
     * Example hierarchy:
     *   Root (groupLayers)
     *   ├─ children[0] = Layer Group A
     *   │  ├─ children[0] = Layer 1 in Group A (path: [0, 0])
     *   │  └─ children[1] = Layer 2 in Group A (path: [0, 1])
     *   └─ children[1] = Layer Group B
     *      └─ children[0] = Layer 1 in Group B (path: [1, 0])
     *
     * The path indices correspond to the order layers appear in the GIMP Layers panel,
     * with each number indicating the child index at that nesting level.
     */
    this._layers = layerPointers.map((layerPointer: number) => {
      const layer = new GimpLayer(this, this._buffer!.slice(layerPointer));
      const path = layer.pathInfo;

      if (!path) {
        // No ITEM_PATH: this is a root-level layer (not in any group)
        this._groupLayers.children.push({
          layer: toPublicLayer(layer),
          children: [],
        });
      } else {
        // ITEM_PATH present: layer is in a group hierarchy
        const pathData = getPropertyData<ParsedPropItemPath>(path);

        if (!pathData) {
          return layer;
        }

        // Validate hierarchy depth and path items
        this._validator.validateHierarchyDepth(pathData.items.length, pathData.items);

        /**
         * Recursive function to build layer hierarchy tree
         *
         * @param node - Current node in the tree
         * @param index - Current depth in the path array
         * @returns Updated node with layer placed at correct position
         *
         * How it works:
         * 1. If we've reached the end of the path (index === pathData.items.length),
         *    place the layer at this node
         * 2. Otherwise, navigate to the child at pathData.items[index]
         * 3. Create child node if it doesn't exist
         * 4. Recursively continue to next depth level
         *
         * Example: For path [0, 1], this function:
         * - First call (index=0): Navigate to children[0]
         * - Second call (index=1): Navigate to children[0].children[1]
         * - Third call (index=2): Place layer at children[0].children[1].layer
         */
        const toCall = (node: GroupLayerNode, index: number): GroupLayerNode => {
          if (index === pathData.items.length) {
            // Reached end of path: place layer here
            node.layer = toPublicLayer(layer);
          } else {
            // Navigate deeper into hierarchy
            const childIndex = pathData.items[index]!; // Safe: index < length

            // Create child node if it doesn't exist
            if (isUnset(node.children[childIndex])) {
              node.children[childIndex] = {
                layer: null,
                children: [],
              };
            }

            // Recursively process next level
            node.children[childIndex] = toCall(node.children[childIndex]!, index + 1);
          }

          return node;
        };

        // Start recursive hierarchy building from root
        this._groupLayers = toCall(this._groupLayers, 0);
      }
      return layer;
    });

    // Note: Channel parsing for v011 would need similar 64-bit handling
    // Currently only supporting layer parsing for v011
    const channelPointers = (this._header.channelList || []).filter(remove_empty);

    // Validate channel pointers are within bounds
    this._validator.validatePointers(channelPointers, uint8Buffer, "channel pointer");

    this._channels = channelPointers.map((channelPointer: number) => {
      return new GimpChannel(this, this._buffer!.slice(channelPointer));
    });
  }

  getBufferForPointer(offset: number): Uint8Array {
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
  getProps<T extends XCF_PropType>(prop: T, index?: string): XCF_PropTypeMap[T] | number | null {
    if (!this._props) {
      this._props = {};
      (this._header!.propertyList || []).forEach((property: ParsedProperty) => {
        // Type assertion needed: ParsedProperty is a union that gets narrowed by property.type
        this._props![property.type as T] = property as unknown as XCF_PropTypeMap[T];
      });
    }

    const propValue = this._props[prop];
    if (index) {
      return getPropertyField<number>(propValue, index);
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
    const data = getPropertyData<{ colours: ParsedRGB[] }>(colormapProp);
    if (data?.colours) {
      return data.colours.map((c: ParsedRGB) => ({
        red: c.red,
        green: c.green,
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
          const segmentKey = segments[i]!; // Safe: i < length
          const cursorChildren = cursor.children as unknown as Record<string, GroupLayerNode>;
          cursorChildren[segmentKey] = cursorChildren[segmentKey] || {
            layer: null,
            children: [],
          };
          cursorChildren[segmentKey]!.children = cursorChildren[segmentKey]!.children || [];
          cursor = cursorChildren[segmentKey]!;
        }
        const lastSegment = segments[segments.length - 1]!; // Safe: length > 0
        const cursorChildren = cursor.children as unknown as Record<string, GroupLayerNode>;
        cursorChildren[lastSegment] = cursorChildren[lastSegment] || {
          layer: null,
          children: [],
        };
        cursorChildren[lastSegment]!.layer = toPublicLayer(layer);
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
   * Find layers matching a regular expression pattern.
   *
   * Searches layer names using the provided regex pattern. Useful for finding
   * multiple layers with similar names or filtering by naming conventions.
   *
   * @param pattern - Regular expression pattern to match against layer names
   * @param flags - Optional regex flags (e.g., 'i' for case-insensitive)
   * @returns Array of layers whose names match the pattern
   *
   * @example
   * ```typescript
   * // Find all layers starting with "bg"
   * const bgLayers = parser.findLayersByPattern(/^bg/i);
   *
   * // Find layers with numbers in their names
   * const numberedLayers = parser.findLayersByPattern(/\d+/);
   *
   * // Find layers containing "temp" or "draft"
   * const tempLayers = parser.findLayersByPattern(/temp|draft/i);
   * ```
   */
  findLayersByPattern(pattern: RegExp | string, flags?: string): GimpLayer[] {
    const regex = typeof pattern === "string" ? new RegExp(pattern, flags) : pattern;
    return this.layers.filter((layer) => regex.test(layer.name));
  }

  /**
   * Filter layers by a custom predicate function.
   *
   * Provides maximum flexibility for filtering layers based on any criteria:
   * name, visibility, opacity, dimensions, group membership, etc.
   *
   * @param predicate - Function that returns true for layers to include
   * @returns Array of layers matching the predicate
   *
   * @example
   * ```typescript
   * // Find all visible layers
   * const visibleLayers = parser.filterLayers(layer => layer.isVisible);
   *
   * // Find large layers (>1000px width)
   * const largeLayers = parser.filterLayers(layer => layer.width > 1000);
   *
   * // Find layers in specific group
   * const groupLayers = parser.filterLayers(layer => layer.groupName === 'Effects');
   *
   * // Find semi-transparent layers
   * const transparentLayers = parser.filterLayers(layer => layer.opacity < 255);
   * ```
   */
  filterLayers(predicate: (layer: GimpLayer) => boolean): GimpLayer[] {
    return this.layers.filter(predicate);
  }

  /**
   * Find layers by group name (parent folder).
   *
   * Returns all layers that belong to a specific layer group.
   *
   * @param groupName - Name of the layer group to search
   * @returns Array of layers in the specified group
   *
   * @example
   * ```typescript
   * // Find all layers in the "Background" group
   * const bgGroupLayers = parser.getLayersByGroup('Background');
   *
   * // Find layers not in any group (root level)
   * const rootLayers = parser.getLayersByGroup('');
   * ```
   */
  getLayersByGroup(groupName: string): GimpLayer[] {
    return this.layers.filter((layer) => layer.groupName === groupName);
  }

  /**
   * Get all visible layers (respecting isVisible property).
   *
   * Filters layers to only those with their visibility flag enabled.
   *
   * @returns Array of visible layers
   *
   * @example
   * ```typescript
   * // Render only visible layers
   * const visibleLayers = parser.getVisibleLayers();
   * const image = new XCFImage(parser.width, parser.height);
   * visibleLayers.reverse().forEach(layer => {
   *   layer.composite(image);
   * });
   * ```
   */
  getVisibleLayers(): GimpLayer[] {
    return this.layers.filter((layer) => layer.isVisible);
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
    options?: { ignoreVisibility?: boolean }
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
