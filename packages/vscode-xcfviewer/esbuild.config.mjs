import esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build extension
await esbuild.build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
  minify: false,
  logLevel: "info",
});

// Copy xcfreader browser bundle to dist
const xcfreaderBundlePath = join(__dirname, "../xcfreader/dist/xcfreader.browser.js");
const targetPath = join(__dirname, "dist/xcfreader.browser.js");

try {
  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(xcfreaderBundlePath, targetPath);
  console.log("Copied xcfreader browser bundle to dist/");
} catch (err) {
  console.error("Failed to copy xcfreader browser bundle:", err);
  process.exit(1);
}

console.log("VS Code extension built successfully!");
