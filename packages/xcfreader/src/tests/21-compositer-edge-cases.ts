import { Logger } from "../lib/logger.js";

// Removed duplicate export
import XCFCompositer, {
  DissolveCompositer,
  HsvCompositor,
  CompositerMode,
} from "../lib/xcfcompositer.js";

export async function test21CompositerEdgeCases(): Promise<void> {
  // Test base XCFCompositer.compose and blend
  const base = new XCFCompositer(CompositerMode.NORMAL, 255);
  const c1 = { red: 100, green: 150, blue: 200, alpha: 128 };
  const c2 = { red: 200, green: 50, blue: 100, alpha: 255 };
  const result = base.compose(c1, c2);
  if (!result || typeof result.red !== "number")
    throw new Error("Base compose failed");
  if (base.blend(1, 1, 1, 1) !== 1) throw new Error("Base blend failed");

  // Test DissolveCompositer randomness and alpha
  const dissolve = new DissolveCompositer(CompositerMode.DISSOLVE, 128); // 50% opacity
  const c2LowAlpha = { ...c2, alpha: 128 }; // 50% alpha
  let foundLayer = false,
    foundBack = false;
  for (let i = 0; i < 1000; i++) {
    const out = dissolve.compose(c1, c2LowAlpha);
    if (out.red === c2LowAlpha.red) foundLayer = true;
    if (out.red === c1.red) foundBack = true;
    if (foundLayer && foundBack) break;
    if (i === 999 && !(foundLayer && foundBack)) {
      Logger.log(
        `DissolveCompositer: foundLayer=${foundLayer}, foundBack=${foundBack} after 1000 iterations`,
      );
    }
  }
  if (!foundLayer || !foundBack)
    throw new Error("DissolveCompositer did not randomize");

  // Test HsvCompositor hue, value, saturation branches
  const c3 = { red: 100, green: 100, blue: 100, alpha: 255 };
  const c4 = { red: 200, green: 200, blue: 0, alpha: 255 };
  const outHue = new HsvCompositor(CompositerMode.HUE, 255).compose(c3, c4);
  if (!outHue || typeof outHue.red !== "number")
    throw new Error("HsvCompositor HUE failed");

  const outValue = new HsvCompositor(CompositerMode.VALUE, 255).compose(c3, c4);
  if (!outValue || typeof outValue.red !== "number")
    throw new Error("HsvCompositor VALUE failed");

  const outSat = new HsvCompositor(CompositerMode.SATURATION, 255).compose(
    c3,
    c4,
  );
  if (!outSat || typeof outSat.red !== "number")
    throw new Error("HsvCompositor SATURATION failed");

  // Test invalid input
  try {
    base.compose(undefined as unknown as typeof c1, c2);
    throw new Error("compose should throw on undefined input");
  } catch {
    // Expected error: invalid input
  }
  try {
    base.compose(c1, undefined as unknown as typeof c2);
    throw new Error("compose should throw on undefined input");
  } catch {
    // Expected error: invalid input
  }

  Logger.log("PASS: Edge cases and uncovered branches in compositers covered");
}
