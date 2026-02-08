/**
 * Lightweight binary reader for XCF file parsing
 * Replaces binary-parser with XCF-specific optimized implementation
 */

import { Buffer } from "buffer";

export class BinaryReader {
  private offset = 0;

  constructor(private buffer: Buffer) {}

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
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Read signed 8-bit integer
   */
  readInt8(): number {
    const value = this.buffer.readInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /**
   * Read unsigned 32-bit big-endian integer
   */
  readUInt32BE(): number {
    const value = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  /**
   * Read signed 32-bit big-endian integer
   */
  readInt32BE(): number {
    const value = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  /**
   * Read 32-bit big-endian float
   */
  readFloatBE(): number {
    const value = this.buffer.readFloatBE(this.offset);
    this.offset += 4;
    return value;
  }

  /**
   * Read 32-bit little-endian float
   */
  readFloatLE(): number {
    const value = this.buffer.readFloatLE(this.offset);
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
    const value = this.buffer.toString("ascii", this.offset, end);
    this.offset = end + 1; // Skip the null terminator
    return value;
  }

  /**
   * Read fixed-length ASCII string
   */
  readString(length: number): string {
    const value = this.buffer.toString("ascii", this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  /**
   * Read buffer slice of specified length
   */
  readBuffer(length: number): Buffer {
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
    return this.buffer.readUInt32BE(this.offset);
  }

  /**
   * Skip bytes
   */
  skip(bytes: number): void {
    this.offset += bytes;
  }
}
