import { XCFParser as GimpParser, XCFImage } from "../gimpparser.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const xcfPath = path.resolve(__dirname, "../../examples/text.xcf");
const outDir = path.resolve(__dirname, "../examples/output");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async function main() {
  try {
    const parser = await GimpParser.parseFileAsync(xcfPath);
    const layers = parser.layers;
    const image = new XCFImage(parser.width, parser.height);

    layers
      .slice()
      .reverse()
      .forEach((layer: any) => {
        const layerImage = layer.makeImage();
        layer.makeImage(image, true);
        layerImage.writeImage(path.resolve(outDir, layer.name + ".png"));
        console.log(layer.parasites);
      });

    image.writeImage(path.resolve(outDir, "multi1.png"), () => {
      console.log("Image 1 saved");
    });

    parser.createImage().writeImage(path.resolve(outDir, "multi2.png"), () => {
      console.log("Image 2 saved");
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
