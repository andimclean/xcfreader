import { XCFParser } from "../gimpparser.js";
import { Logger } from "../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function test09MultiLayerNames(): Promise<void> {
  const xcfPath = path.resolve(__dirname, "../../../../example-xcf/multi.xcf");
  const parser = await XCFParser.parseFileAsync(xcfPath);

  const expectedLayerNames = [
    "base",
    "shaded",
    "tr_red",
    "bl_red",
    "Layer Group",
    "tl_red",
    "br_red",
    "contents",
  ];
  const actualLayerNames = parser.layers.map((layer) => layer.name);

  // Check that we have the expected number of layers
  if (parser.layers.length !== 10) {
    throw new Error(`Expected 10 layers, got ${parser.layers.length}`);
  }

  // Check that expected layer names are present
  for (const expectedName of expectedLayerNames) {
    if (!actualLayerNames.includes(expectedName)) {
      throw new Error(
        `Expected layer "${expectedName}" not found. Actual layers: ${actualLayerNames.join(", ")}`,
      );
    }
  }

  // Check for duplicates (br_red appears 3 times)
  const brRedCount = actualLayerNames.filter(
    (name) => name === "br_red",
  ).length;
  if (brRedCount !== 3) {
    throw new Error(`Expected 3 "br_red" layers, found ${brRedCount}`);
  }

  Logger.log(
    `PASS: multi.xcf layer names verified: ${actualLayerNames.join(", ")}`,
  );
}
