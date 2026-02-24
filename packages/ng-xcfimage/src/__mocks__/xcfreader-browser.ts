export const XCFParser = {
  parseBuffer: jest.fn(),
};

export class XCFDataImage {
  private buffer: Uint8ClampedArray;

  constructor(
    public width: number,
    public height: number
  ) {
    this.buffer = new Uint8ClampedArray(width * height * 4);
  }

  getDataBuffer(): Uint8ClampedArray {
    return this.buffer;
  }
}
