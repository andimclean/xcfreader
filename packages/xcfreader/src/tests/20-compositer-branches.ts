import { GeneralCompositer, CompositerMode } from "../lib/xcfcompositer.js";
import { Logger } from "../lib/logger.js";

export async function test20CompositerBranches(): Promise<void> {
  // Test all blend modes for branch coverage
  const modes = [
    CompositerMode.MULTIPLY,
    CompositerMode.SCREEN,
    CompositerMode.OVERLAY,
    CompositerMode.DIFFERENCE,
    CompositerMode.ADDITION,
    CompositerMode.SUBTRACT,
    CompositerMode.DRAKEN_ONLY,
    CompositerMode.LIGHTEN_ONLY,
    CompositerMode.DIVIDE,
    CompositerMode.DODGE,
    CompositerMode.BURN,
    CompositerMode.HARD_LIGHT,
    CompositerMode.SOFT_LIGHT,
    CompositerMode.GRAIN_EXTRACT,
    CompositerMode.GRAIN_MERGE
  ];
  const a = 0.6, b = 0.4;
  for (const mode of modes) {
    const compositer = new GeneralCompositer(mode, 255);
    const result = compositer.chooseFunction(a, b);
    if (typeof result !== "number" || Number.isNaN(result)) {
      throw new Error(`Mode ${mode} failed branch test`);
    }
  }
  Logger.log("PASS: All GeneralCompositer blend mode branches covered");

  // Test edge cases for clamp and div
  const compositer = new GeneralCompositer(CompositerMode.ADDITION, 255);
  if (compositer.clamp(-1) !== 0) throw new Error("clamp(-1) should be 0");
  if (compositer.clamp(2) !== 1) throw new Error("clamp(2) should be 1");
  if (compositer.clamp(0.5) !== 0.5) throw new Error("clamp(0.5) should be 0.5");
  if (compositer.div(0, 0) !== 0) throw new Error("div(0,0) should be 0");
  if (compositer.div(1, 0) !== 1) throw new Error("div(1,0) should be 1");
  if (compositer.div(4, 2) !== 2) throw new Error("div(4,2) should be 2");
  Logger.log("PASS: clamp and div edge cases covered");
}
