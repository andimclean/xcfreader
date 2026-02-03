import { Logger } from "../lib/logger.js";
import { GeneralCompositer, CompositerMode } from "../lib/xcfcompositer.js";

export async function test18CompositerModes(): Promise<void> {
  // Test: GeneralCompositer.chooseFunction returns a function for each mode
  const modes = [
    CompositerMode.NORMAL,
    CompositerMode.DISSOLVE,
    CompositerMode.MULTIPLY,
    CompositerMode.SCREEN,
    CompositerMode.OVERLAY,
    CompositerMode.DIFFERENCE,
    CompositerMode.ADDITION,
    CompositerMode.SUBTRACT,
    CompositerMode.DRAKEN_ONLY,
    CompositerMode.LIGHTEN_ONLY,
    CompositerMode.HUE,
    CompositerMode.SATURATION,
    CompositerMode.COLOUR,
    CompositerMode.VALUE,
    CompositerMode.DIVIDE,
    CompositerMode.DODGE,
    CompositerMode.BURN,
    CompositerMode.HARD_LIGHT,
    CompositerMode.SOFT_LIGHT,
    CompositerMode.GRAIN_EXTRACT,
    CompositerMode.GRAIN_MERGE,
  ];
  for (const mode of modes) {
    const compositer = new GeneralCompositer(mode, 255);
    // chooseFunction expects two floats, returns a float
    const result = compositer.chooseFunction(0.5, 0.5);
    if (typeof result !== "number") {
      throw new Error(`Mode ${mode} did not return a number`);
    }
  }
  Logger.log(
    "PASS: GeneralCompositer.chooseFunction returns numbers for all modes",
  );

  // Test: Normal compositing blends two colors as expected (compose method)
  const compositer = new GeneralCompositer(CompositerMode.NORMAL, 128);
  const a = { red: 100, green: 100, blue: 100, alpha: 255 };
  const b = { red: 200, green: 50, blue: 50, alpha: 255 };
  const out = compositer.compose(a, b);
  if (out.red === a.red && out.green === a.green && out.blue === a.blue) {
    throw new Error("Normal blend did not modify output");
  }
  Logger.log("PASS: Normal compositing blends colors");
}
