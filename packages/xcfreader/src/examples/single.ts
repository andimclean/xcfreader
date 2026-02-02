import { Logger } from "../lib/logger.js";
import { XCFParser as GimpParser } from "../gimpparser.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../examples/single.xcf");
const outDir = path.resolve(__dirname, "../examples/output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    const image = parser.createImage();
    await image.writeImage(path.resolve(outDir, "single1.png"));
    Logger.log("Image 1 saved");
  } catch (err) {
    Logger.error(err);
    process.exit(1);
  }
})();
