import { Logger } from "../lib/logger.js";
import { XCFParser as GimpParser, XCFPNGImage } from "../node.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../../../example-xcf/text.xcf");
const outDir = path.resolve(__dirname, '../../../../output/text');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    const layers = parser.layers;
    const image = new XCFPNGImage(parser.width, parser.height);

    for (const layer of layers.slice().reverse()) {
      const layerImage = new XCFPNGImage(layer.width, layer.height);
      layer.makeImage(layerImage);
      layer.makeImage(image, true);
      await layerImage.writeImage(path.resolve(outDir, layer.name + ".png"));
      Logger.log(layer.parasites);
    }

    await image.writeImage(path.resolve(outDir, "multi1.png"));
    Logger.log("Image 1 saved");

    const image2 = new XCFPNGImage(parser.width, parser.height);
    parser.createImage(image2);
    await image2.writeImage(path.resolve(outDir, "multi2.png"));
    Logger.log("Image 2 saved");
  } catch (err) {
    Logger.error(err);
    process.exit(1);
  }
})();
