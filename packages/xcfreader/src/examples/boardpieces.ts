import { Logger } from "../lib/logger.js";
import { XCFParser as GimpParser, XCFPNGImage } from "../node.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../../../example-xcf/boardpieces.xcf");
const outDir = path.resolve(__dirname, '../../../../output/boardpieces');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    const image = new XCFPNGImage(parser.width, parser.height);
    parser.createImage(image);
    await image.writeImage(path.resolve(outDir, "boardpieces.png"));
    Logger.log(`Rendered boardpieces.xcf (${parser.width}x${parser.height}, ${parser.layers.length} layers)`);
  } catch (err) {
    Logger.error(err);
    process.exit(1);
  }
})();
