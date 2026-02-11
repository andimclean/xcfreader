/**
 * Lightweight binary reader for XCF file parsing
 * Uses native browser APIs (Uint8Array, DataView, TextDecoder)
 * Works in both Node.js and browser environments
 */

export class BinaryReader {
  private offset = 0;
  private view: DataView;
  private buffer: Uint8Array;
  private textDecoder = new TextDecoder("ascii");

  /**
   * Create a BinaryReader from ArrayBuffer, Uint8Array, or Node.js Buffer
   * @param data - ArrayBuffer, Uint8Array, or Buffer (Buffer extends Uint8Array)
   */
  constructor(data: ArrayBuffer | Uint8Array) {
    // Handle both ArrayBuffer and Uint8Array (Buffer extends Uint8Array)
    if (data instanceof ArrayBuffer) {
      this.buffer = new Uint8Array(data);
      this.view = new DataView(data);
    } else {
      this.buffer = data;
      // Handle Uint8Array or Buffer (which has byteOffset/byteLength)
      this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    }
  }

  /**
   * Get current read position
   */
  getOffset(): number {
    return this.offset;
  }

  /**
   * Set read position
   */
  seek(offset: number): void {
    this.offset = offset;
  }

  /**
   * Get remaining bytes
   */
  getRemainingBytes(): number {
    return this.buffer.length - this.offset;
  }

  /**
   * Read unsigned 8-bit integer
   */
  readUInt8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Read signed 8-bit integer
   */
  readInt8(): number {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Read unsigned 32-bit big-endian integer
   */
  readUInt32BE(): number {
    const value = this.view.getUint32(this.offset, false); // false = big-endian
    this.offset += 4;
    return value;
  }

  /**
   * Read signed 32-bit big-endian integer
   */
  readInt32BE(): number {
    const value = this.view.getInt32(this.offset, false); // false = big-endian
    this.offset += 4;
    return value;
  }

  /**
   * Read 32-bit big-endian float
   */
  readFloatBE(): number {
    const value = this.view.getFloat32(this.offset, false); // false = big-endian
    this.offset += 4;
    return value;
  }

  /**
   * Read 32-bit little-endian float
   */
  readFloatLE(): number {
    const value = this.view.getFloat32(this.offset, true); // true = little-endian
    this.offset += 4;
    return value;
  }

  /**
   * Read zero-terminated ASCII string
   */
  readZeroTerminatedString(): string {
    let end = this.offset;
    while (end < this.buffer.length && this.buffer[end] !== 0) {
      end++;
    }
    const bytes = this.buffer.subarray(this.offset, end);
    const value = this.textDecoder.decode(bytes);
    this.offset = end + 1; // Skip the null terminator
    return value;
  }

  /**
   * Read fixed-length ASCII string
   */
  readString(length: number): string {
    const bytes = this.buffer.subarray(this.offset, this.offset + length);
    const value = this.textDecoder.decode(bytes);
    this.offset += length;
    return value;
  }

  /**
   * Read Uint8Array slice of specified length
   */
  readBuffer(length: number): Uint8Array {
    const value = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  /**
   * Read array of UInt32BE until predicate returns true
   */
  readUInt32ArrayUntil(predicate: (value: number) => boolean): number[] {
    const result: number[] = [];
    while (this.offset < this.buffer.length) {
      const value = this.readUInt32BE();
      result.push(value);
      if (predicate(value)) {
        break;
      }
    }
    return result;
  }

  /**
   * Read array of items using a reader function until predicate returns true
   */
  readArrayUntil<T>(reader: (br: BinaryReader) => T, predicate: (value: T) => boolean): T[] {
    const result: T[] = [];
    while (this.offset < this.buffer.length) {
      const value = reader(this);
      result.push(value);
      if (predicate(value)) {
        break;
      }
    }
    return result;
  }

  /**
   * Read fixed-length array using a reader function
   */
  readArray<T>(reader: (br: BinaryReader) => T, count: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      result.push(reader(this));
    }
    return result;
  }

  /**
   * Create a new BinaryReader at a specific offset
   */
  readerAtOffset(offset: number): BinaryReader {
    const reader = new BinaryReader(this.buffer);
    reader.seek(offset);
    return reader;
  }

  /**
   * Peek at UInt32BE without advancing offset
   */
  peekUInt32BE(): number {
    return this.view.getUint32(this.offset, false); // false = big-endian
  }

  /**
   * Skip bytes
   */
  skip(bytes: number): void {
    this.offset += bytes;
  }
}
