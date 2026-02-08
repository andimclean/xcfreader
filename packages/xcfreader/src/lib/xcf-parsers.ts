/**
 * XCF file format parsers using BinaryReader
 * Replaces binary-parser declarative parsers with functional parsers
 */

import { BinaryReader } from "./binary-reader.js";
import { Buffer } from "buffer";
import { XCF_PropType, ParsedProperty, ParsedRGB, ParsedParasiteItem } from "../types/index.js";
import { XCFParseError } from "../gimpparser.js";

// ============================================================================
// Basic Type Parsers
// ============================================================================

/**
 * Parse RGB color (3 bytes)
 */
export function parseRGB(reader: BinaryReader): ParsedRGB {
  return {
    red: reader.readUInt8(),
    greed: reader.readUInt8(), // Note: XCF format has typo "greed" instead of "green"
    blue: reader.readUInt8(),
  };
}

/**
 * Parse zero-terminated string
 */
export function parseZeroTerminatedString(reader: BinaryReader): string {
  return reader.readZeroTerminatedString();
}

/**
 * Parse 64-bit offset (two 32-bit values)
 */
export interface Offset64 {
  high: number;
  low: number;
}

export function parseOffset64(reader: BinaryReader): Offset64 {
  return {
    high: reader.readUInt32BE(),
    low: reader.readUInt32BE(),
  };
}

/**
 * Convert 64-bit offset to number (assumes value fits in 53-bit precision)
 */
export function offset64ToNumber(offset: Offset64): number {
  return offset.high * 0x100000000 + offset.low;
}

// ============================================================================
// Property Parsers
// ============================================================================

export interface ColorMapProp {
  length: number;
  numcolours: number;
  colours: ParsedRGB[];
}

export function parseColorMapProp(reader: BinaryReader): ColorMapProp {
  const length = reader.readUInt32BE();
  const numcolours = reader.readUInt32BE();
  const colours = reader.readArray((br) => parseRGB(br), numcolours);

  return { length, numcolours, colours };
}

export interface GuideProp {
  length: number;
  guides: Array<{ c: number; o: number }>;
}

export function parseGuidesProp(reader: BinaryReader): GuideProp {
  const length = reader.readUInt32BE();
  const count = length / 5; // Each guide is 5 bytes (int32 + int8)

  const guides = reader.readArray(
    (br) => ({
      c: br.readInt32BE(),
      o: br.readInt8(),
    }),
    count
  );

  return { length, guides };
}

export interface ModeProp {
  length: number;
  mode: number;
}

export function parseModeProp(reader: BinaryReader): ModeProp {
  const length = reader.readUInt32BE();
  if (length !== 4) {
    throw new XCFParseError(`MODE property: expected length 4, got ${length}`);
  }
  const mode = reader.readUInt32BE();
  return { length, mode };
}

export interface OpacityProp {
  length: number;
  opacity: number;
}

export function parseOpacityProp(reader: BinaryReader): OpacityProp {
  const length = reader.readUInt32BE();
  const opacity = reader.readUInt32BE();
  return { length, opacity };
}

export interface FloatOpacityProp {
  length: number;
  opacity: number;
}

export function parseFloatOpacityProp(reader: BinaryReader): FloatOpacityProp {
  const length = reader.readUInt32BE();
  if (length !== 4) {
    throw new XCFParseError(`FLOAT_OPACITY property: expected length 4, got ${length}`);
  }
  const opacity = reader.readFloatBE();
  return { length, opacity };
}

export interface OffsetsProp {
  length: number;
  dx: number;
  dy: number;
}

export function parseOffsetsProp(reader: BinaryReader): OffsetsProp {
  const length = reader.readUInt32BE();
  if (length !== 8) {
    throw new XCFParseError(`OFFSETS property: expected length 8, got ${length}`);
  }
  const dx = reader.readInt32BE();
  const dy = reader.readInt32BE();
  return { length, dx, dy };
}

export interface ColorProp {
  length: number;
  r: number;
  g: number;
  b: number;
}

export function parseColorProp(reader: BinaryReader): ColorProp {
  const length = reader.readUInt32BE();
  if (length !== 3) {
    throw new XCFParseError(`COLOR property: expected length 3, got ${length}`);
  }
  const r = reader.readInt8();
  const g = reader.readInt8();
  const b = reader.readInt8();
  return { length, r, g, b };
}

export interface FloatColorProp {
  length: number;
  r: number;
  g: number;
  b: number;
}

export function parseFloatColorProp(reader: BinaryReader): FloatColorProp {
  const length = reader.readUInt32BE();
  if (length !== 12) {
    throw new XCFParseError(`FLOAT_COLOR property: expected length 12, got ${length}`);
  }
  const r = reader.readFloatBE();
  const g = reader.readFloatBE();
  const b = reader.readFloatBE();
  return { length, r, g, b };
}

export interface ResolutionProp {
  length: number;
  x: number;
  y: number;
}

export function parseResolutionProp(reader: BinaryReader): ResolutionProp {
  const length = reader.readUInt32BE();
  const x = reader.readFloatLE();
  const y = reader.readFloatLE();
  return { length, x, y };
}

export interface ParasiteProp {
  length: number;
  parasite: Buffer;
}

export function parseParasiteProp(reader: BinaryReader): ParasiteProp {
  const length = reader.readUInt32BE();
  const parasite = reader.readBuffer(length);
  return { length, parasite };
}

export function parseParasiteItem(reader: BinaryReader): ParsedParasiteItem {
  const name_length = reader.readUInt32BE();
  const name = reader.readZeroTerminatedString();
  const flags = reader.readUInt32BE();
  const length = reader.readUInt32BE();
  const details = reader.readBuffer(length);

  return { name_length, name, flags, length, details };
}

export function parseFullParasiteArray(buffer: Buffer): ParsedParasiteItem[] {
  const reader = new BinaryReader(buffer);
  const items: ParsedParasiteItem[] = [];

  while (reader.getRemainingBytes() > 0) {
    items.push(parseParasiteItem(reader));
  }

  return items;
}

export interface ItemPathProp {
  length: number;
  items: number[];
}

export function parseItemPathProp(reader: BinaryReader): ItemPathProp {
  const length = reader.readUInt32BE();
  const count = length / 4; // Each item is 4 bytes
  const items = reader.readArray((br) => br.readUInt32BE(), count);
  return { length: count, items };
}

export interface SimpleProp {
  length: number;
  value: number;
}

/**
 * Parse a simple property with length assertion and single uint32 value
 */
export function parseSimpleProp(
  reader: BinaryReader,
  expectedLength: number,
  propName: string
): SimpleProp {
  const length = reader.readUInt32BE();
  if (length !== expectedLength) {
    throw new XCFParseError(
      `${propName} property: expected length ${expectedLength}, got ${length}`
    );
  }
  const value = reader.readUInt32BE();
  return { length, value };
}

/**
 * Parse a property with just length (no data)
 */
export interface EmptyProp {
  length: number;
}

export function parseEmptyProp(
  reader: BinaryReader,
  expectedLength: number,
  propName: string
): EmptyProp {
  const length = reader.readUInt32BE();
  if (length !== expectedLength) {
    throw new XCFParseError(
      `${propName} property: expected length ${expectedLength}, got ${length}`
    );
  }
  return { length };
}

/**
 * Parse generic/unknown property
 */
export interface GenericProp {
  length: number;
  buffer: Buffer;
}

export function parseGenericProp(reader: BinaryReader): GenericProp {
  const length = reader.readUInt32BE();
  const buffer = reader.readBuffer(length);
  return { length, buffer };
}

// ============================================================================
// Main Property Parser (Switch on type)
// ============================================================================

/**
 * Parse a single property based on its type
 */
export function parseProperty(reader: BinaryReader): ParsedProperty {
  const type = reader.readUInt32BE();

  let data: unknown;

  switch (type) {
    case XCF_PropType.END:
      data = parseEmptyProp(reader, 0, "END");
      break;

    case XCF_PropType.COLORMAP:
      data = parseColorMapProp(reader);
      break;

    case XCF_PropType.ACTIVE_LAYER:
      data = parseEmptyProp(reader, 0, "ACTIVE_LAYER");
      break;

    case XCF_PropType.ACTIVE_CHANNEL:
      data = parseEmptyProp(reader, 0, "ACTIVE_CHANNEL");
      break;

    case XCF_PropType.SELECTION:
      data = parseEmptyProp(reader, 0, "SELECTION");
      break;

    case XCF_PropType.FLOATING_SELECTION: {
      const length = reader.readUInt32BE();
      const layerPtrBuf = reader.readBuffer(length);
      data = { length, layerPtrBuf };
      break;
    }

    case XCF_PropType.OPACITY:
      data = parseOpacityProp(reader);
      break;

    case XCF_PropType.MODE:
      data = parseModeProp(reader);
      break;

    case XCF_PropType.VISIBLE: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`VISIBLE property: expected length 4, got ${length}`);
      }
      const isVisible = reader.readUInt32BE();
      data = { length, isVisible };
      break;
    }

    case XCF_PropType.LINKED: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`LINKED property: expected length 4, got ${length}`);
      }
      const isLinked = reader.readUInt32BE();
      data = { length, isLinked };
      break;
    }

    case XCF_PropType.LOCK_ALPHA: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`LOCK_ALPHA property: expected length 4, got ${length}`);
      }
      const alpha = reader.readUInt32BE();
      data = { length, alpha };
      break;
    }

    case XCF_PropType.APPLY_MASK: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`APPLY_MASK property: expected length 4, got ${length}`);
      }
      const mask = reader.readUInt32BE();
      data = { length, mask };
      break;
    }

    case XCF_PropType.EDIT_MASK: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`EDIT_MASK property: expected length 4, got ${length}`);
      }
      const editmask = reader.readUInt32BE();
      data = { length, editmask };
      break;
    }

    case XCF_PropType.SHOW_MASK: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`SHOW_MASK property: expected length 4, got ${length}`);
      }
      const showmask = reader.readUInt32BE();
      data = { length, showmask };
      break;
    }

    case XCF_PropType.SHOW_MASKED: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`SHOW_MASKED property: expected length 4, got ${length}`);
      }
      const showmasked = reader.readUInt32BE();
      data = { length, showmasked };
      break;
    }

    case XCF_PropType.OFFSETS:
      data = parseOffsetsProp(reader);
      break;

    case XCF_PropType.COLOR:
      data = parseColorProp(reader);
      break;

    case XCF_PropType.COMPRESSION: {
      const length = reader.readUInt32BE();
      const compressionType = reader.readUInt8();
      if (length !== 1) {
        throw new XCFParseError(`COMPRESSION property: expected length 1, got ${length}`);
      }
      data = { length, compressionType };
      break;
    }

    case XCF_PropType.GUIDES:
      data = parseGuidesProp(reader);
      break;

    case XCF_PropType.RESOLUTION:
      data = parseResolutionProp(reader);
      break;

    case XCF_PropType.TATTOO:
      data = { length: reader.readUInt32BE(), tattoo: reader.readUInt32BE() };
      break;

    case XCF_PropType.PARASITES:
      data = parseParasiteProp(reader);
      break;

    case XCF_PropType.UNIT:
      data = { length: reader.readUInt32BE(), c: reader.readUInt32BE() };
      break;

    case XCF_PropType.TEXT_LAYER_FLAGS:
      data = { length: reader.readUInt32BE(), f: reader.readUInt32BE() };
      break;

    case XCF_PropType.LOCK_CONTENT: {
      const length = reader.readUInt32BE();
      const isLocked = reader.readUInt32BE();
      data = { length, isLocked };
      break;
    }

    case XCF_PropType.GROUP_ITEM:
      data = parseEmptyProp(reader, 0, "GROUP_ITEM");
      break;

    case XCF_PropType.ITEM_PATH:
      data = parseItemPathProp(reader);
      break;

    case XCF_PropType.GROUP_ITEM_FLAGS: {
      const length = reader.readUInt32BE();
      const flags = reader.readUInt32BE();
      data = { length, flags };
      break;
    }

    case XCF_PropType.FLOAT_OPACITY:
      data = parseFloatOpacityProp(reader);
      break;

    case XCF_PropType.COLOR_TAG: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`COLOR_TAG property: expected length 4, got ${length}`);
      }
      const colorTag = reader.readUInt32BE();
      data = { length, colorTag };
      break;
    }

    case XCF_PropType.COMPOSITE_MODE: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`COMPOSITE_MODE property: expected length 4, got ${length}`);
      }
      const compositeMode = reader.readUInt32BE();
      data = { length, compositeMode };
      break;
    }

    case XCF_PropType.COMPOSITE_SPACE: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`COMPOSITE_SPACE property: expected length 4, got ${length}`);
      }
      const compositeSpace = reader.readUInt32BE();
      data = { length, compositeSpace };
      break;
    }

    case XCF_PropType.BLEND_SPACE: {
      const length = reader.readUInt32BE();
      if (length !== 4) {
        throw new XCFParseError(`BLEND_SPACE property: expected length 4, got ${length}`);
      }
      const blendSpace = reader.readUInt32BE();
      data = { length, blendSpace };
      break;
    }

    case XCF_PropType.FLOAT_COLOR:
      data = parseFloatColorProp(reader);
      break;

    case XCF_PropType.SAMPLE_POINTS_V2: {
      const length = reader.readUInt32BE();
      const samplePoints = reader.readBuffer(length);
      data = { length, samplePoints };
      break;
    }

    default:
      // Unknown property type - read as generic buffer
      data = parseGenericProp(reader);
      break;
  }

  return { type, data } as ParsedProperty;
}

// ============================================================================
// Layer Parsers (V10 and V11)
// ============================================================================

export interface ParsedLayerV10 {
  width: number;
  height: number;
  type: number;
  name_length: number;
  name: string;
  propertyList: ParsedProperty[];
  hptr: number;
  mptr: number;
}

export function parseLayerV10(reader: BinaryReader): ParsedLayerV10 {
  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const type = reader.readUInt32BE();
  const name_length = reader.readUInt32BE();
  const name = reader.readZeroTerminatedString();

  const propertyList = reader.readArrayUntil(
    (br) => parseProperty(br),
    (item) => item.type === 0
  );

  const hptr = reader.readUInt32BE();
  const mptr = reader.readUInt32BE();

  return {
    width,
    height,
    type,
    name_length,
    name,
    propertyList,
    hptr,
    mptr,
  };
}

export interface ParsedLayerV11 {
  width: number;
  height: number;
  type: number;
  name_length: number;
  name: string;
  propertyList: ParsedProperty[];
  hptr_high: number;
  hptr_low: number;
  mptr_high: number;
  mptr_low: number;
}

export function parseLayerV11(reader: BinaryReader): ParsedLayerV11 {
  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const type = reader.readUInt32BE();
  const name_length = reader.readUInt32BE();
  const name = reader.readZeroTerminatedString();

  const propertyList = reader.readArrayUntil(
    (br) => parseProperty(br),
    (item) => item.type === 0
  );

  const hptr_high = reader.readUInt32BE();
  const hptr_low = reader.readUInt32BE();
  const mptr_high = reader.readUInt32BE();
  const mptr_low = reader.readUInt32BE();

  return {
    width,
    height,
    type,
    name_length,
    name,
    propertyList,
    hptr_high,
    hptr_low,
    mptr_high,
    mptr_low,
  };
}

// ============================================================================
// Hierarchy Parsers (V10 and V11)
// ============================================================================

export interface ParsedHierarchyV10 {
  width: number;
  height: number;
  bpp: number;
  lptr: number;
}

export function parseHierarchyV10(reader: BinaryReader): ParsedHierarchyV10 {
  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const bpp = reader.readUInt32BE();
  const lptr = reader.readUInt32BE();

  return { width, height, bpp, lptr };
}

export interface ParsedHierarchyV11 {
  width: number;
  height: number;
  bpp: number;
  lptr_high: number;
  lptr_low: number;
}

export function parseHierarchyV11(reader: BinaryReader): ParsedHierarchyV11 {
  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const bpp = reader.readUInt32BE();
  const lptr_high = reader.readUInt32BE();
  const lptr_low = reader.readUInt32BE();

  return { width, height, bpp, lptr_high, lptr_low };
}

// ============================================================================
// Level Parsers (V10 and V11)
// ============================================================================

export interface ParsedLevelV10 {
  width: number;
  height: number;
  tptr: number[];
}

export function parseLevelV10(reader: BinaryReader): ParsedLevelV10 {
  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const tptr = reader.readUInt32ArrayUntil((item) => item === 0);

  return { width, height, tptr };
}

export interface ParsedLevelV11 {
  width: number;
  height: number;
  tptr64: Offset64[];
}

export function parseLevelV11(reader: BinaryReader): ParsedLevelV11 {
  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const tptr64 = reader.readArrayUntil(
    (br) => parseOffset64(br),
    (item) => item.high === 0 && item.low === 0
  );

  return { width, height, tptr64 };
}

// ============================================================================
// Header Parsers (V10 and V11)
// ============================================================================

export interface ParsedGimpHeaderV10 {
  magic: string;
  version: string;
  padding: number;
  width: number;
  height: number;
  base_type: number;
  propertyList: ParsedProperty[];
  layerList: number[];
  channelList: number[];
}

export function parseGimpHeaderV10(buffer: Buffer): ParsedGimpHeaderV10 {
  const reader = new BinaryReader(buffer);

  const magic = reader.readString(9);
  const version = reader.readString(4);
  const padding = reader.readInt8();

  if (padding !== 0) {
    throw new XCFParseError(`XCF header: expected padding byte 0, got ${padding}`);
  }

  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const base_type = reader.readUInt32BE();

  const propertyList = reader.readArrayUntil(
    (br) => parseProperty(br),
    (item) => item.type === 0
  );

  const layerList = reader.readUInt32ArrayUntil((item) => item === 0);
  const channelList = reader.readUInt32ArrayUntil((item) => item === 0);

  return {
    magic,
    version,
    padding,
    width,
    height,
    base_type,
    propertyList,
    layerList,
    channelList,
  };
}

export interface ParsedGimpHeaderV11 {
  magic: string;
  version: string;
  padding: number;
  width: number;
  height: number;
  base_type: number;
  precision: number;
  propertyList: ParsedProperty[];
  layerList64: Offset64[];
  channelList64: Offset64[];
}

export function parseGimpHeaderV11(buffer: Buffer): ParsedGimpHeaderV11 {
  const reader = new BinaryReader(buffer);

  const magic = reader.readString(9);
  const version = reader.readString(4);
  const padding = reader.readInt8();

  if (padding !== 0) {
    throw new XCFParseError(`XCF header: expected padding byte 0, got ${padding}`);
  }

  const width = reader.readUInt32BE();
  const height = reader.readUInt32BE();
  const base_type = reader.readUInt32BE();
  const precision = reader.readUInt32BE();

  const propertyList = reader.readArrayUntil(
    (br) => parseProperty(br),
    (item) => item.type === 0
  );

  const layerList64 = reader.readArrayUntil(
    (br) => parseOffset64(br),
    (item) => item.high === 0 && item.low === 0
  );

  const channelList64 = reader.readArrayUntil(
    (br) => parseOffset64(br),
    (item) => item.high === 0 && item.low === 0
  );

  return {
    magic,
    version,
    padding,
    width,
    height,
    base_type,
    precision,
    propertyList,
    layerList64,
    channelList64,
  };
}
