import { Logger } from "../lib/logger.js";
import { XCFParser as GimpParser, XCFPNGImage } from "../node.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../examples/multi.xcf");
const outDir = path.resolve(__dirname, "../examples/output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    const layers = parser.layers;
    const image = new XCFPNGImage(parser.width, parser.height);
     Logger.log(parser.groupLayers);

    layers
      .slice()
      .reverse()
      .forEach((layer) => {
        const layerImage = new XCFPNGImage(layer.width, layer.height);
        layer.makeImage(layerImage);
         Logger.log(layer.name);
        layer.makeImage(image, true);
        layerImage.writeImage(path.resolve(outDir, layer.name + ".png"));
      });

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
