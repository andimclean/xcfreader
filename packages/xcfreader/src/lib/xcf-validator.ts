/**
 * XCF file validation utilities
 * Provides comprehensive validation for XCF file structure and integrity
 * @module xcfreader/lib/xcf-validator
 */

/**
 * Validation error thrown when XCF file structure is invalid or corrupted
 */
export class XCFValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XCFValidationError";
  }
}

/**
 * Validation options for XCF parsing
 */
export interface ValidationOptions {
  /** Validate layer hierarchy for circular references (default: true) */
  checkCircularReferences?: boolean;
  /** Validate layer pointers are within buffer bounds (default: true) */
  checkPointerBounds?: boolean;
  /** Validate layer dimensions are reasonable (default: true) */
  checkLayerDimensions?: boolean;
  /** Maximum allowed layer depth (default: 100) */
  maxLayerDepth?: number;
  /** Maximum allowed image dimension (default: 524288 = 512K pixels) */
  maxDimension?: number;
}

const DEFAULT_OPTIONS: Required<ValidationOptions> = {
  checkCircularReferences: true,
  checkPointerBounds: true,
  checkLayerDimensions: true,
  maxLayerDepth: 100,
  maxDimension: 524288, // 512K pixels per dimension (GIMP's default max)
};

/**
 * XCF file validator
 */
export class XCFValidator {
  private options: Required<ValidationOptions>;
  private visitedPointers: Set<number>;

  constructor(options: ValidationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.visitedPointers = new Set();
  }

  /**
   * Validate buffer size and magic bytes
   */
  validateHeader(buffer: ArrayBuffer | Uint8Array): void {
    // Convert ArrayBuffer to Uint8Array if needed
    const uint8Buffer = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

    // Check minimum buffer size (header is at least 14 bytes)
    if (uint8Buffer.length < 14) {
      throw new XCFValidationError(
        `XCF file too small: ${uint8Buffer.length} bytes (minimum 14 bytes required)`
      );
    }

    // Validate magic bytes
    const magicBytes = uint8Buffer.subarray(0, 4);
    const magic = new TextDecoder("utf-8").decode(magicBytes);
    if (magic !== "gimp") {
      throw new XCFValidationError(`Invalid magic bytes: expected "gimp", got "${magic}"`);
    }

    // Validate version string format
    const versionBytes = uint8Buffer.subarray(9, 13);
    const versionStr = new TextDecoder("utf-8").decode(versionBytes);

    // XCF files can have two formats:
    // 1. Old format: "gimp xcf file" (version = "file")
    // 2. New format: "gimp xcf v0XX" (version = "v010", "v011", etc.)
    if (versionStr === "file") {
      // Old XCF format - this is valid
      return;
    }

    if (!versionStr.startsWith("v0")) {
      throw new XCFValidationError(
        `Invalid version format: expected "v0XX" or "file", got "${versionStr}"`
      );
    }

    // Parse and validate version number for new format
    const version = parseInt(versionStr.replace("v", ""), 10);
    if (isNaN(version) || version < 0 || version > 99) {
      throw new XCFValidationError(`Invalid version number: ${versionStr} (must be v000-v099)`);
    }
  }

  /**
   * Validate image dimensions
   */
  validateImageDimensions(width: number, height: number): void {
    if (!this.options.checkLayerDimensions) return;

    if (width <= 0 || height <= 0) {
      throw new XCFValidationError(
        `Invalid image dimensions: ${width}x${height} (must be positive)`
      );
    }

    if (width > this.options.maxDimension) {
      throw new XCFValidationError(
        `Image width ${width} exceeds maximum allowed dimension ${this.options.maxDimension}`
      );
    }

    if (height > this.options.maxDimension) {
      throw new XCFValidationError(
        `Image height ${height} exceeds maximum allowed dimension ${this.options.maxDimension}`
      );
    }

    // Check for potential integer overflow
    const totalPixels = width * height;
    if (totalPixels > Number.MAX_SAFE_INTEGER / 4) {
      throw new XCFValidationError(
        `Image dimensions ${width}x${height} would cause integer overflow`
      );
    }
  }

  /**
   * Validate layer dimensions
   */
  validateLayerDimensions(
    width: number,
    height: number,
    offsetX: number,
    offsetY: number,
    layerName: string = "unknown"
  ): void {
    if (!this.options.checkLayerDimensions) return;

    if (width < 0 || height < 0) {
      throw new XCFValidationError(
        `Layer "${layerName}" has negative dimensions: ${width}x${height}`
      );
    }

    if (width > this.options.maxDimension) {
      throw new XCFValidationError(
        `Layer "${layerName}" width ${width} exceeds maximum ${this.options.maxDimension}`
      );
    }

    if (height > this.options.maxDimension) {
      throw new XCFValidationError(
        `Layer "${layerName}" height ${height} exceeds maximum ${this.options.maxDimension}`
      );
    }

    // Validate offsets are reasonable (within reasonable bounds)
    const MAX_OFFSET = 1000000000; // 1 billion pixels offset
    if (Math.abs(offsetX) > MAX_OFFSET || Math.abs(offsetY) > MAX_OFFSET) {
      throw new XCFValidationError(
        `Layer "${layerName}" has unreasonable offsets: (${offsetX}, ${offsetY})`
      );
    }
  }

  /**
   * Validate pointer is within buffer bounds
   */
  validatePointer(pointer: number, buffer: Uint8Array, context: string = "pointer"): void {
    if (!this.options.checkPointerBounds) return;

    if (pointer < 0) {
      throw new XCFValidationError(`Negative ${context}: ${pointer}`);
    }

    if (pointer >= buffer.length) {
      throw new XCFValidationError(`${context} ${pointer} exceeds buffer size ${buffer.length}`);
    }

    // Check for circular references by tracking visited pointers
    if (this.options.checkCircularReferences) {
      if (this.visitedPointers.has(pointer)) {
        throw new XCFValidationError(
          `Circular reference detected: ${context} ${pointer} already visited`
        );
      }
      this.visitedPointers.add(pointer);
    }
  }

  /**
   * Validate array of pointers
   */
  validatePointers(pointers: number[], buffer: Uint8Array, context: string = "pointer list"): void {
    if (!this.options.checkPointerBounds) return;

    // Check for duplicate pointers (potential circular references)
    const seen = new Set<number>();
    for (let i = 0; i < pointers.length; i++) {
      const ptr = pointers[i]!; // Safe: i < length

      // Skip zero pointers (valid empty markers)
      if (ptr === 0) continue;

      this.validatePointer(ptr, buffer, `${context}[${i}]`);

      if (seen.has(ptr)) {
        throw new XCFValidationError(
          `Duplicate pointer in ${context}: ${ptr} appears multiple times`
        );
      }
      seen.add(ptr);
    }
  }

  /**
   * Validate layer hierarchy depth
   */
  validateHierarchyDepth(depth: number, pathItems: number[]): void {
    if (depth > this.options.maxLayerDepth) {
      throw new XCFValidationError(
        `Layer hierarchy depth ${depth} exceeds maximum ${this.options.maxLayerDepth} (path: ${pathItems.join(".")})`
      );
    }

    // Validate path items are non-negative
    for (let i = 0; i < pathItems.length; i++) {
      const item = pathItems[i]!; // Safe: i < length
      if (item < 0) {
        throw new XCFValidationError(`Invalid negative path index at depth ${i}: ${item}`);
      }

      // Check for unreasonably large indices (potential corruption)
      if (item > 10000) {
        throw new XCFValidationError(
          `Unreasonably large path index at depth ${i}: ${item} (max 10000)`
        );
      }
    }
  }

  /**
   * Validate base type value
   */
  validateBaseType(baseType: number): void {
    const validTypes = [0, 1, 2]; // RGB, GRAYSCALE, INDEXED
    if (!validTypes.includes(baseType)) {
      throw new XCFValidationError(
        `Invalid base type: ${baseType} (must be 0=RGB, 1=GRAYSCALE, or 2=INDEXED)`
      );
    }
  }

  /**
   * Reset validator state for new validation
   */
  reset(): void {
    this.visitedPointers.clear();
  }
}
