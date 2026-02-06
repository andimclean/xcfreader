import { test01ParseSingle } from "./01-parse-single.js";
import { test02CreateImage } from "./02-create-image.js";
import { test03ParseMulti } from "./03-parse-multi.js";
import { test04Map1Layers } from "./04-map1-layers.js";
import { test05TextParasites } from "./05-text-parasites.js";
import { test06ParseEmpty } from "./06-parse-empty.js";
import { test07ErrorHandling } from "./07-error-handling.js";
import { test08GetLayerByName } from "./08-get-layer-by-name.js";
import { test09MultiLayerNames } from "./09-multi-layer-names.js";
import { test10XCFDataImage } from "./10-xcf-data-image.js";
import { test11BrowserExports } from "./11-browser-exports.js";
import { test12ToBlobAndDataURL } from "./12-to-blob-dataurl.js";
import { test13CreateImageFromLayers } from "./13-create-image-from-layers.js";
import { test14GrayscaleSupport } from "./14-grayscale-support.js";
import { test15IndexedColorSupport } from "./15-indexed-color-support.js";
import { test16FullColorSupport } from "./16-fullcolour-support.js";
import { test17Int32 } from "./17-int32-support.js";
import { test22Float32 } from "./22-float32-support.js";
import { test23GameSprites } from "./23-game-sprites.js";
import { test24V011Features } from "./24-v011-features.js";
import { test25DuplicateLayerNames } from "./25-duplicate-layer-names.js";
import { test26PipeFile } from "./26-pipe-file.js";
import { test27FloatingSelectionV011 } from "./27-floating-selection-v011.js";

import { test18CompositerModes } from "./18-compositer-modes.js";
import { test19Logger } from "./19-logger.js";
import { test20CompositerBranches } from "./20-compositer-branches.js";
import { test21CompositerEdgeCases } from "./21-compositer-edge-cases.js";
import { test22ParserEdgeCases } from "./unit/22-parser-edge-cases.js";
import { test23PrecisionConversion } from "./unit/23-precision-conversion.js";
import { test24PropertyParsing } from "./unit/24-property-parsing.js";
import { test25LayerHierarchy } from "./unit/25-layer-hierarchy.js";
import { test26Validation } from "./26-validation.js";
import { test27V012Format } from "./27-v012-format.js";
import { test28LayerFiltering } from "./28-layer-filtering.js";
import { test29Float32Support } from "./29-float32-support.js";
import { test30IconParsing } from "./30-icon-parsing.js";
import { test31PipeIndexed } from "./31-pipe-indexed.js";
import { test32GameAssets } from "./32-game-assets.js";
import { test33LargeImage } from "./33-large-image.js";
import { Logger } from "../lib/logger.js";

const tests = [
  { name: "01-parse-single.ts", fn: test01ParseSingle },
  { name: "02-create-image.ts", fn: test02CreateImage },
  { name: "03-parse-multi.ts", fn: test03ParseMulti },
  { name: "04-map1-layers.ts", fn: test04Map1Layers },
  { name: "05-text-parasites.ts", fn: test05TextParasites },
  { name: "06-parse-empty.ts", fn: test06ParseEmpty },
  { name: "07-error-handling.ts", fn: test07ErrorHandling },
  { name: "08-get-layer-by-name.ts", fn: test08GetLayerByName },
  { name: "09-multi-layer-names.ts", fn: test09MultiLayerNames },
  { name: "10-xcf-data-image.ts", fn: test10XCFDataImage },
  { name: "11-browser-exports.ts", fn: test11BrowserExports },
  { name: "12-to-blob-dataurl.ts", fn: test12ToBlobAndDataURL },
  { name: "13-create-image-from-layers.ts", fn: test13CreateImageFromLayers },
  { name: "14-grayscale-support.ts", fn: test14GrayscaleSupport },
  { name: "15-indexed-color-support.ts", fn: test15IndexedColorSupport },
  { name: "16-fullcolour-support.ts", fn: test16FullColorSupport },
  { name: "17-int32-support.ts", fn: test17Int32 },
  { name: "22-float32-support.ts", fn: test22Float32 },
  { name: "23-game-sprites.ts", fn: test23GameSprites },
  { name: "24-v011-features.ts", fn: test24V011Features },
  { name: "25-duplicate-layer-names.ts", fn: test25DuplicateLayerNames },
  { name: "26-pipe-file.ts", fn: test26PipeFile },
  { name: "27-floating-selection-v011.ts", fn: test27FloatingSelectionV011 },
  { name: "18-compositer-modes.ts", fn: test18CompositerModes },
  { name: "19-logger.ts", fn: test19Logger },
  { name: "20-compositer-branches.ts", fn: test20CompositerBranches },
  { name: "21-compositer-edge-cases.ts", fn: test21CompositerEdgeCases },
  { name: "22-parser-edge-cases.ts (unit)", fn: test22ParserEdgeCases },
  { name: "23-precision-conversion.ts (unit)", fn: test23PrecisionConversion },
  { name: "24-property-parsing.ts (unit)", fn: test24PropertyParsing },
  { name: "25-layer-hierarchy.ts (unit)", fn: test25LayerHierarchy },
  { name: "26-validation.ts", fn: test26Validation },
  { name: "27-v012-format.ts", fn: test27V012Format },
  { name: "28-layer-filtering.ts", fn: test28LayerFiltering },
  { name: "29-float32-support.ts", fn: test29Float32Support },
  { name: "30-icon-parsing.ts", fn: test30IconParsing },
  { name: "31-pipe-indexed.ts", fn: test31PipeIndexed },
  { name: "32-game-assets.ts", fn: test32GameAssets },
  { name: "33-large-image.ts", fn: test33LargeImage },
];

async function runTests(): Promise<void> {
  for (const test of tests) {
    Logger.log(`Running ${test.name}`);
    try {
      await test.fn();
    } catch (error) {
      Logger.error(`FAIL: ${test.name} - ${error}`);
      process.exit(1);
    }
  }
  Logger.log("All tests passed");
}

runTests().catch((error) => {
  Logger.error("Test runner error:", error);
  process.exit(1);
});
