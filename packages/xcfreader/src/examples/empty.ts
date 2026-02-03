import { XCFParser as GimpParser } from "../gimpparser.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../../../example-xcf/empty.xcf");
const outDir = path.resolve(__dirname, "../examples/output/empty");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    Logger.log("Layers:", parser.layers.length);
  } catch (err) {
    Logger.error(err);
    process.exit(1);
  }
})();
import { Logger } from "../lib/logger.js";
