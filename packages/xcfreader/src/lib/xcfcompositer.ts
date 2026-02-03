/**
 * xcfreader - Parse and render GIMP XCF files
 * Copyright (c) 2026 Andi McLean
 * Licensed under the MIT License
 * https://github.com/andimclean/xcfreader
 */

export enum CompositerMode {
  NORMAL = 0,
  DISSOLVE = 1,
  BEHIND = 2,
  MULTIPLY = 3,
  SCREEN = 4,
  OVERLAY = 5,
  DIFFERENCE = 6,
  ADDITION = 7,
  SUBTRACT = 8,
  DRAKEN_ONLY = 9,
  LIGHTEN_ONLY = 10,
  HUE = 11,
  SATURATION = 12,
  COLOUR = 13,
  VALUE = 14,
  DIVIDE = 15,
  DODGE = 16,
  BURN = 17,
  HARD_LIGHT = 18,
  SOFT_LIGHT = 19,
  GRAIN_EXTRACT = 20,
  GRAIN_MERGE = 21,
}

interface Color {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

interface RGB {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

interface HSV {
  hue: number;
  saturation: number;
  value: number;
  alpha: number;
}

const isUnset = (value: unknown): boolean => {
  return value === null || value === undefined;
};

function xcfToFloat(value: number): number {
  return value / 255;
}

function floatToXcf(value: number): number {
  return Math.round(value * 255);
}

class HsvColor {
  private _rgb: RGB | null = null;
  private _hsv: HSV | null = null;

  get rgb(): Color {
    this.generateRGB();
    return {
      red: floatToXcf(this._rgb!.red),
      green: floatToXcf(this._rgb!.green),
      blue: floatToXcf(this._rgb!.blue),
      alpha: this._rgb!.alpha,
    };
  }

  set rgb(rgb: Color) {
    this._rgb = {
      red: xcfToFloat(rgb.red),
      green: xcfToFloat(rgb.green),
      blue: xcfToFloat(rgb.blue),
      alpha: rgb.alpha ?? 255,
    };
    this._hsv = null;
  }

  get red(): number {
    this.generateRGB();
    return floatToXcf(this._rgb!.red);
  }

  set red(red: number) {
    this.generateRGB();
    this._rgb!.red = red;
    this._hsv = null;
  }

  get green(): number {
    this.generateRGB();
    return floatToXcf(this._rgb!.green);
  }

  set green(green: number) {
    this.generateRGB();
    this._rgb!.green = green;
    this._hsv = null;
  }

  get blue(): number {
    this.generateRGB();
    return floatToXcf(this._rgb!.blue);
  }

  set blue(blue: number) {
    this.generateRGB();
    this._rgb!.blue = blue;
    this._hsv = null;
  }

  generateRGB(): void {
    if (isUnset(this._rgb)) {
      if (isUnset(this._hsv)) {
        throw new Error("RGB or HSV has not been set");
      }
      if (this._hsv!.saturation === 0) {
        this._rgb = {
          red: this._hsv!.value,
          green: this._hsv!.value,
          blue: this._hsv!.value,
          alpha: this._hsv!.alpha,
        };
      } else {
        let hue = this._hsv!.hue;
        if (hue === 1) {
          hue = 0;
        }

        hue *= 6;
        const i = Math.floor(hue);
        const f = hue - i;

        const w = this._hsv!.value * (1 - this._hsv!.saturation);
        const q = this._hsv!.value * (1 - this._hsv!.saturation * f);
        const t = this._hsv!.value * (1 - this._hsv!.saturation * (1 - f));

        let newRgb: RGB;
        switch (i) {
          case 0:
            newRgb = {
              red: this._hsv!.value,
              green: t,
              blue: w,
              alpha: this._hsv!.alpha,
            };
            break;
          case 1:
            newRgb = {
              red: q,
              green: this._hsv!.value,
              blue: w,
              alpha: this._hsv!.alpha,
            };
            break;
          case 2:
            newRgb = {
              red: w,
              green: this._hsv!.value,
              blue: t,
              alpha: this._hsv!.alpha,
            };
            break;
          case 3:
            newRgb = {
              red: w,
              green: q,
              blue: this._hsv!.value,
              alpha: this._hsv!.alpha,
            };
            break;
          case 4:
            newRgb = {
              red: t,
              green: w,
              blue: this._hsv!.value,
              alpha: this._hsv!.alpha,
            };
            break;
          case 5:
            newRgb = {
              red: this._hsv!.value,
              green: w,
              blue: q,
              alpha: this._hsv!.alpha,
            };
            break;
          default:
            newRgb = { red: 0, green: 0, blue: 0, alpha: 0 };
        }
        this._rgb = newRgb;
      }
    }
  }

  get hsv(): Color {
    this.generateHSV();

    return {
      red: floatToXcf(this._hsv!.hue),
      green: floatToXcf(this._hsv!.saturation),
      blue: floatToXcf(this._hsv!.value),
      alpha: this._hsv!.alpha,
    };
  }

  set hsv(hsv: Color) {
    this._hsv = {
      hue: xcfToFloat(hsv.red),
      saturation: xcfToFloat(hsv.green),
      value: xcfToFloat(hsv.blue),
      alpha: hsv.alpha ?? 255,
    };
    this._rgb = null;
  }

  get hue(): number {
    this.generateHSV();
    return floatToXcf(this._hsv!.hue);
  }

  set hue(hue: number) {
    this.generateHSV();
    this._rgb = null;
    this._hsv!.hue = xcfToFloat(hue);
  }

  get saturation(): number {
    this.generateHSV();
    return floatToXcf(this._hsv!.saturation);
  }

  set saturation(saturation: number) {
    this.generateHSV();
    this._rgb = null;
    this._hsv!.saturation = xcfToFloat(saturation);
  }

  get value(): number {
    this.generateHSV();
    return floatToXcf(this._hsv!.value);
  }

  set value(value: number) {
    this.generateHSV();
    this._rgb = null;
    this._hsv!.value = xcfToFloat(value);
  }

  generateHSV(): void {
    if (isUnset(this._hsv)) {
      if (isUnset(this._rgb)) {
        throw new Error("HSV or RGB has not been set");
      }

      const max = Math.max(this._rgb!.red, this._rgb!.green, this._rgb!.blue);
      const min = Math.min(this._rgb!.red, this._rgb!.green, this._rgb!.blue);

      const newHsv: HSV = {
        hue: 0,
        saturation: 0,
        value: (min + max) / 2,
        alpha: this._rgb!.alpha,
      };

      if (min === max) {
        newHsv.saturation = 0;
        newHsv.hue = 0;
      } else {
        if (newHsv.value <= 0.5) {
          newHsv.saturation = (max - min) / (max + min);
        } else {
          newHsv.saturation = (max - min) / (2.0 - max - min);
        }
        let delta = max - min;

        if (delta === 0) {
          delta = 1;
        }

        if (this._rgb!.red === max) {
          newHsv.hue = (this._rgb!.green - this._rgb!.blue) / delta;
        } else if (this._rgb!.green === max) {
          newHsv.hue = 2 + (this._rgb!.blue - this._rgb!.red) / delta;
        } else {
          newHsv.hue = 4 + (this._rgb!.red - this._rgb!.green) / delta;
        }

        newHsv.hue /= 6;
        if (newHsv.hue < 0) {
          newHsv.hue += 1;
        }
      }

      this._hsv = newHsv;
    }
  }
}

class XCFCompositer {
  protected _mode: CompositerMode;
  protected _opacity: number;

  static makeCompositer(mode: CompositerMode, opacity: number): XCFCompositer {
    switch (mode) {
      case CompositerMode.DISSOLVE:
        return new DissolveCompositer(mode, opacity);
      case CompositerMode.MULTIPLY:
      case CompositerMode.SCREEN:
      case CompositerMode.OVERLAY:
      case CompositerMode.DIFFERENCE:
      case CompositerMode.ADDITION:
      case CompositerMode.SUBTRACT:
      case CompositerMode.DRAKEN_ONLY:
      case CompositerMode.LIGHTEN_ONLY:
      case CompositerMode.DIVIDE:
      case CompositerMode.DODGE:
      case CompositerMode.BURN:
      case CompositerMode.HARD_LIGHT:
      case CompositerMode.SOFT_LIGHT:
      case CompositerMode.GRAIN_EXTRACT:
      case CompositerMode.GRAIN_MERGE:
        return new GeneralCompositer(mode, opacity);
      case CompositerMode.HUE:
      case CompositerMode.SATURATION:
      case CompositerMode.VALUE:
        return new HsvCompositor(mode, opacity);
    }
    // return the default compositer
    return new XCFCompositer(mode, opacity);
  }

  constructor(mode: CompositerMode, opacity: number) {
    this._mode = mode;
    this._opacity = xcfToFloat(opacity);
  }

  compose(backColour: Color, layerColour: Color): Color {
    const a1 = xcfToFloat(backColour.alpha ?? 255);
    const a2 = xcfToFloat((layerColour.alpha as number) ?? 255) * this._opacity;
    const red = floatToXcf(
      this.blend(
        a1,
        xcfToFloat(backColour.red),
        a2,
        xcfToFloat(layerColour.red),
      ),
    );
    const green = floatToXcf(
      this.blend(
        a1,
        xcfToFloat(backColour.green),
        a2,
        xcfToFloat(layerColour.green),
      ),
    );
    const blue = floatToXcf(
      this.blend(
        a1,
        xcfToFloat(backColour.blue),
        a2,
        xcfToFloat(layerColour.blue),
      ),
    );
    return {
      red: red,
      green: green,
      blue: blue,
      alpha: floatToXcf(1 - (1 - a1) * (1 - a2)),
    };
  }

  blend(a1: number, x1: number, a2: number, x2: number): number {
    const div = 1 - (1 - a1) * (1 - a2);
    const k = a2 / div;
    const col = (1 - k) * x1 + k * x2;

    return col;
  }

  clamp(value: number): number {
    if (value < 0) {
      return 0;
    }
    if (value > 1) {
      return 1;
    }
    return value;
  }

  div(u: number, l: number): number {
    if (l === 0) {
      return u === 0 ? 0 : 1;
    }
    return u / l;
  }
}

class DissolveCompositer extends XCFCompositer {
  compose(backColour: Color, layerColour: Color): Color {
    const a2 = xcfToFloat((layerColour.alpha as number) ?? 255) * this._opacity;
    const random = Math.random();
    return {
      red: random < a2 ? layerColour.red : backColour.red,
      green: random < a2 ? layerColour.green : backColour.green,
      blue: random < a2 ? layerColour.blue : backColour.blue,
      alpha: random < a2 ? 255 : backColour.alpha,
    };
  }
}

class GeneralCompositer extends XCFCompositer {
  compose(backColour: Color, layerColour: Color): Color {
    const a1 = xcfToFloat(backColour.alpha ?? 255);
    const a2 = xcfToFloat((layerColour.alpha as number) ?? 255) * this._opacity;
    const red = floatToXcf(
      this.performBlend(
        a1,
        xcfToFloat(backColour.red),
        a2,
        xcfToFloat(layerColour.red),
      ),
    );
    const green = floatToXcf(
      this.performBlend(
        a1,
        xcfToFloat(backColour.green),
        a2,
        xcfToFloat(layerColour.green),
      ),
    );
    const blue = floatToXcf(
      this.performBlend(
        a1,
        xcfToFloat(backColour.blue),
        a2,
        xcfToFloat(layerColour.blue),
      ),
    );
    return {
      red: red,
      green: green,
      blue: blue,
      alpha: floatToXcf(a1),
    };
  }

  performBlend(a1: number, x1: number, a2: number, x2: number): number {
    return this.blend(a1, x1, Math.min(a1, a2), this.chooseFunction(x1, x2));
  }

  chooseFunction(x1: number, x2: number): number {
    switch (this._mode) {
      case CompositerMode.MULTIPLY:
        return x1 * x2;
      case CompositerMode.SCREEN:
        return 1 - (1 - x1) * (1 - x2);
      case CompositerMode.OVERLAY:
        return Math.pow((1 - x2) * x1, 2) + Math.pow(x2 * (1 - (1 - x2)), 2);
      case CompositerMode.DIFFERENCE:
        return x1 > x2 ? x1 - x2 : x2 - x1;
      case CompositerMode.ADDITION:
        return this.clamp(x1 + x2);
      case CompositerMode.SUBTRACT:
        return this.clamp(x1 - x2);
      case CompositerMode.DRAKEN_ONLY:
        return Math.min(x1, x2);
      case CompositerMode.LIGHTEN_ONLY:
        return Math.max(x1, x2);
      case CompositerMode.DIVIDE:
        return this.clamp(this.div(x1, x2));
      case CompositerMode.DODGE:
        return this.clamp(this.div(x1, 1 - x2));
      case CompositerMode.BURN:
        return this.clamp(this.div(1 - (1 - x1), x2));
      case CompositerMode.HARD_LIGHT:
        return x2 < 0.5 ? 2 * x1 * x2 : 1 - 2 * (1 - x1) * (1 - x2);
      case CompositerMode.SOFT_LIGHT:
        return (1 - x2) * Math.pow(x1, 2) + x2 * (1 - Math.pow(1 - x1, 2));
      case CompositerMode.GRAIN_EXTRACT:
        return this.clamp(x1 - x2 + 0.5);
      case CompositerMode.GRAIN_MERGE:
        return this.clamp(x1 + x2 - 0.5);
    }
    return x2;
  }
}

class HsvCompositor extends XCFCompositer {
  constructor(mode: CompositerMode, opacity: number) {
    super(mode, opacity);
  }

  compose(backColour: Color, layerColour: Color): Color {
    const inA = xcfToFloat(backColour.alpha ?? 255);
    const laA = xcfToFloat(layerColour.alpha ?? 255);

    const compA = Math.min(inA, laA) * this._opacity;

    const newA = inA + (1 - inA) * compA;

    if (compA && newA) {
      const ratio = compA / newA;

      const layerHSV = new HsvColor();
      const backHsv = new HsvColor();
      layerHSV.rgb = layerColour;
      backHsv.rgb = backColour;

      switch (this._mode) {
        case CompositerMode.HUE:
          if (layerHSV.saturation) {
            backHsv.hue = layerHSV.hue;
          }
          break;
        case CompositerMode.VALUE:
          backHsv.value = layerHSV.value;
          break;
        case CompositerMode.SATURATION:
          backHsv.saturation = layerHSV.saturation;
          break;
      }
      const newRgb = backHsv.rgb;

      return {
        red: newRgb.red * ratio + (1 - ratio) * backColour.red,
        green: newRgb.green * ratio + (1 - ratio) * backColour.green,
        blue: newRgb.blue * ratio + (1 - ratio) * backColour.blue,
        alpha: newRgb.alpha,
      };
    }

    return backColour;
  }
}

export default XCFCompositer;
export { GeneralCompositer, DissolveCompositer, HsvCompositor };
