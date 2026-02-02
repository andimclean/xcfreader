/**
 * Type definitions for XCF file parsing
 * @module xcfreader/types
 */

import { Buffer } from "buffer";

/**
 * XCF property types enum - identifies different property types in XCF files
 */
export enum XCF_PropType {
  END = 0,
  COLORMAP = 1,
  ACTIVE_LAYER = 2,
  ACTIVE_CHANNEL = 3,
  SELECTION = 4,
  FLOATING_SELECTION = 5,
  OPACITY = 6,
  MODE = 7,
  VISIBLE = 8,
  LINKED = 9,
  LOCK_ALPHA = 10,
  APPLY_MASK = 11,
  EDIT_MASK = 12,
  SHOW_MASK = 13,
  SHOW_MASKED = 14,
  OFFSETS = 15,
  COLOR = 16,
  COMPRESSION = 17,
  GUIDES = 18,
  RESOLUTION = 19,
  TATTOO = 20,
  PARASITES = 21,
  UNIT = 22,
  PATHS = 23,
  USER_UNIT = 24,
  VECTORS = 25,
  TEXT_LAYER_FLAGS = 26,
  SAMPLE_POINTS = 27,
  LOCK_CONTENT = 28,
  GROUP_ITEM = 29,
  ITEM_PATH = 30,
  GROUP_ITEM_FLAGS = 31,
  LOCK_POSITION = 32,
  FLOAT_OPACITY = 33,
}

// ============================================
// Color types
// ============================================

/**
 * RGB color with red, green, blue components (0-255)
 */
export interface ColorRGB {
  red: number;
  green: number;
  blue: number;
}

/**
 * RGBA color with red, green, blue, alpha components (0-255)
 */
export interface ColorRGBA extends ColorRGB {
  alpha: number;
}

/**
 * GIMP parasite (metadata) attached to layers or images
 */
export interface Parasite {
  name: string;
  flags: number;
  details: Buffer;
}

// ============================================
// Parser result types - used for type documentation
// These types describe the structure of parsed data
// ============================================

/**
 * Base interface for parsed properties - most parser results include a length field
 */
export interface ParsedPropBase {
  length: number;
}

/**
 * Result of parsing a zero-terminated string
 */
export interface ParsedString {
  data: string;
}

/**
 * Result of parsing RGB color data (note: GIMP typo preserved)
 */
export interface ParsedRGB {
  red: number;
  greed: number; // Note: typo in original parser, kept for compatibility
  blue: number;
}

/**
 * Result of parsing color map property
 */
export interface ParsedColorMap extends ParsedPropBase {
  numcolours: number;
  colours: ParsedRGB[];
}

/**
 * Guide entry in guides property
 */
export interface ParsedGuide {
  c: number;
  o: number;
}

/**
 * Result of parsing guides property
 */
export interface ParsedGuides extends ParsedPropBase {
  guides: ParsedGuide[];
}

/**
 * Result of parsing mode property
 */
export interface ParsedMode extends ParsedPropBase {
  mode: number;
}

/**
 * Result of parsing parasite buffer
 */
export interface ParsedParasiteBuffer extends ParsedPropBase {
  parasite: Buffer;
}

/**
 * Result of parsing a single parasite array item
 */
export interface ParsedParasiteItem extends ParsedPropBase {
  name_length: number;
  name: string;
  flags: number;
  details: Buffer;
}

/**
 * Result of parsing full parasite array
 */
export interface ParsedParasiteArray {
  items: ParsedParasiteItem[];
}

/**
 * Property with just length field (used for END, ACTIVE_LAYER, etc.)
 */
export interface ParsedPropLength extends ParsedPropBase {}

/**
 * Property with length and layer pointer
 */
export interface ParsedPropFloatingSelection extends ParsedPropBase {
  layerPtr: number;
}

/**
 * Property with length and opacity
 */
export interface ParsedPropOpacity extends ParsedPropBase {
  opacity: number;
}

/**
 * Property with length and visibility flag
 */
export interface ParsedPropVisible extends ParsedPropBase {
  isVisible: number;
}

/**
 * Property with length and linked flag
 */
export interface ParsedPropLinked extends ParsedPropBase {
  isLinked: number;
}

/**
 * Property with length and alpha lock flag
 */
export interface ParsedPropLockAlpha extends ParsedPropBase {
  alpha: number;
}

/**
 * Property with length and apply mask flag
 */
export interface ParsedPropApplyMask extends ParsedPropBase {
  mask: number;
}

/**
 * Property with length and edit mask flag
 */
export interface ParsedPropEditMask extends ParsedPropBase {
  editmask: number;
}

/**
 * Property with length and show mask flag
 */
export interface ParsedPropShowMask extends ParsedPropBase {
  showmask: number;
}

/**
 * Property with length and show masked flag
 */
export interface ParsedPropShowMasked extends ParsedPropBase {
  showmasked: number;
}

/**
 * Property with offsets (dx, dy)
 */
export interface ParsedPropOffsets extends ParsedPropBase {
  dx: number;
  dy: number;
}

/**
 * Property with color (r, g, b)
 */
export interface ParsedPropColor extends ParsedPropBase {
  r: number;
  g: number;
  b: number;
}

/**
 * Property with compression type
 */
export interface ParsedPropCompression extends ParsedPropBase {
  compressionType: number;
}

/**
 * Property with resolution (x, y)
 */
export interface ParsedPropResolution extends ParsedPropBase {
  x: number;
  y: number;
}

/**
 * Property with tattoo
 */
export interface ParsedPropTattoo extends ParsedPropBase {
  tattoo: number;
}

/**
 * Property with unit
 */
export interface ParsedPropUnit extends ParsedPropBase {
  c: number;
}

/**
 * Property with generic length and f value
 */
export interface ParsedPropLengthF extends ParsedPropBase {
  f: number;
}

/**
 * Property with lock content flag
 */
export interface ParsedPropLockContent extends ParsedPropBase {
  isLocked: number;
}

/**
 * Property with item path
 */
export interface ParsedPropItemPath extends ParsedPropBase {
  items: number[];
}

/**
 * Property with group item flags
 */
export interface ParsedPropGroupItemFlags extends ParsedPropBase {
  flags: number;
}

/**
 * Default/unknown property with raw buffer
 */
export interface ParsedPropDefault extends ParsedPropBase {
  buffer: Buffer;
}

/**
 * Result of parsing a property list item
 */
export interface ParsedProperty {
  type: XCF_PropType;
  data: Record<string, unknown>;
}

/**
 * Result of parsing a layer
 */
export interface ParsedLayer {
  width: number;
  height: number;
  type: number;
  name_length: number;
  name: string;
  propertyList: ParsedProperty[];
  hptr: number;
  mptr: number;
}

/**
 * Result of parsing hierarchy data
 */
export interface ParsedHierarchy {
  width: number;
  height: number;
  bpp: number;
  lptr: number;
}

/**
 * Result of parsing level data
 */
export interface ParsedLevel {
  width: number;
  height: number;
  tptr: number[];
}

/**
 * Result of parsing the GIMP header
 */
export interface ParsedGimpHeader {
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

/**
 * Group layer node structure for layer hierarchy
 */
export interface GroupLayerNode {
  layer: GimpLayerPublic | null;
  children: GroupLayerNode[];
}

/**
 * Public interface for GimpLayer - used for external consumers
 */
export interface GimpLayerPublic {
  readonly name: string;
  readonly groupName: string;
  readonly width: number;
  readonly height: number;
  readonly x: number;
  readonly y: number;
  readonly isVisible: boolean;
  readonly isGroup: boolean;
  readonly colourMode: number;
  readonly mode: number;
  readonly opacity: number;
  readonly parasites: Record<string, Record<string, string>>;
}

/**
 * Compositer mode interface - used for layer blending
 */
export interface CompositerMode {
  compose(bgCol: ColorRGBA, fgCol: ColorRGBA): ColorRGB & { alpha?: number };
}

/**
 * Type mapping from XCF_PropType enum values to their corresponding parsed types
 */
export interface XCF_PropTypeMap {
  [XCF_PropType.END]: ParsedPropLength;
  [XCF_PropType.COLORMAP]: ParsedColorMap;
  [XCF_PropType.ACTIVE_LAYER]: ParsedPropLength;
  [XCF_PropType.ACTIVE_CHANNEL]: ParsedPropLength;
  [XCF_PropType.SELECTION]: ParsedPropLength;
  [XCF_PropType.FLOATING_SELECTION]: ParsedPropFloatingSelection;
  [XCF_PropType.OPACITY]: ParsedPropOpacity;
  [XCF_PropType.MODE]: ParsedMode;
  [XCF_PropType.VISIBLE]: ParsedPropVisible;
  [XCF_PropType.LINKED]: ParsedPropLinked;
  [XCF_PropType.LOCK_ALPHA]: ParsedPropLockAlpha;
  [XCF_PropType.APPLY_MASK]: ParsedPropApplyMask;
  [XCF_PropType.EDIT_MASK]: ParsedPropEditMask;
  [XCF_PropType.SHOW_MASK]: ParsedPropShowMask;
  [XCF_PropType.SHOW_MASKED]: ParsedPropShowMasked;
  [XCF_PropType.OFFSETS]: ParsedPropOffsets;
  [XCF_PropType.COLOR]: ParsedPropColor;
  [XCF_PropType.COMPRESSION]: ParsedPropCompression;
  [XCF_PropType.GUIDES]: ParsedGuides;
  [XCF_PropType.RESOLUTION]: ParsedPropResolution;
  [XCF_PropType.TATTOO]: ParsedPropTattoo;
  [XCF_PropType.PARASITES]: ParsedParasiteBuffer;
  [XCF_PropType.UNIT]: ParsedPropUnit;
  [XCF_PropType.PATHS]: ParsedPropDefault;
  [XCF_PropType.USER_UNIT]: ParsedPropDefault;
  [XCF_PropType.VECTORS]: ParsedPropDefault;
  [XCF_PropType.TEXT_LAYER_FLAGS]: ParsedPropLengthF;
  [XCF_PropType.SAMPLE_POINTS]: ParsedPropDefault;
  [XCF_PropType.LOCK_CONTENT]: ParsedPropLockContent;
  [XCF_PropType.GROUP_ITEM]: ParsedPropLength;
  [XCF_PropType.ITEM_PATH]: ParsedPropItemPath;
  [XCF_PropType.GROUP_ITEM_FLAGS]: ParsedPropGroupItemFlags;
  [XCF_PropType.LOCK_POSITION]: ParsedPropDefault;
  [XCF_PropType.FLOAT_OPACITY]: ParsedPropDefault;
}

/**
 * Helper type to get the parsed property type for a given XCF_PropType
 */
export type PropTypeFor<T extends XCF_PropType> = XCF_PropTypeMap[T];

// ============================================
// Image interface
// ============================================

/**
 * Interface for XCF image rendering output.
 * Implementations provide pixel manipulation and export functionality.
 */
export interface IXCFImage {
  /** Image width in pixels */
  readonly width: number;
  /** Image height in pixels */
  readonly height: number;

  /**
   * Set a pixel color at the specified coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param colour - Color to set (with RGBA values)
   */
  setAt(x: number, y: number, colour: ColorRGBA): void;

  /**
   * Get the color of a pixel at the specified coordinates
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Color at the given coordinates
   */
  getAt(x: number, y: number): ColorRGBA;

  /**
   * Fill a rectangle with a color
   * @param x - X coordinate of top-left corner
   * @param y - Y coordinate of top-left corner
   * @param w - Width of rectangle
   * @param h - Height of rectangle
   * @param colour - Color to fill with
   */
  fillRect(x: number, y: number, w: number, h: number, colour: ColorRGBA): void;

  /**
   * Get the raw RGBA pixel data as a Uint8Array.
   * Useful for browser environments where you want to draw the image to a canvas.
   * @returns Uint8Array of RGBA pixel data (4 bytes per pixel)
   */
  getPixelData(): Uint8Array;
}
