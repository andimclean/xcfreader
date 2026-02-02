import { XCFParser as GimpParser } from "../gimpparser.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { Logger } from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../examples/map1.xcf");
const outDir = path.resolve(__dirname, "../examples/output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function saveLayer(file: string, groupName: string): Promise<void> {
  const parser = await GimpParser.parseFileAsync(file);
  const layer = parser.groupLayers[groupName];
  if (layer && layer.layer) {
    const layerImage = layer.layer.makeImage();
    layerImage.writeImage(path.resolve(outDir, groupName + ".png"), () => {
      Logger.log(`Layer ${groupName} saved`);
    });
  }
}

(async function main() {
  try {
    await saveLayer(xcfPath, "Kopie");
    await saveLayer(xcfPath, "Kopie #1");
  } catch (err) {
    Logger.error(err);
    process.exit(1);
  }
})();
