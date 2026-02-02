declare module 'pngjs-image' {
  interface Color {
    red: number;
    green: number;
    blue: number;
    alpha?: number;
  }

  interface PNGImage {
    getIndex(x: number, y: number): number;
    getRed(idx: number): number;
    getGreen(idx: number): number;
    getBlue(idx: number): number;
    getAlpha(idx: number): number;
    setAt(x: number, y: number, color: Color): void;
    fillRect(x: number, y: number, w: number, h: number, color: Color): void;
    writeImage(filename: string, callback?: (err?: Error) => void): void;
  }

  interface CreateImageFunction {
    (width: number, height: number): PNGImage;
    createImage(width: number, height: number): PNGImage;
  }

  const createImage: CreateImageFunction;
  export = createImage;
}
