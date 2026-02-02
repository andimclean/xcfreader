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
