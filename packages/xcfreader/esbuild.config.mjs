import * as esbuild from "esbuild";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";

// Common plugins for browser polyfills
const browserPlugins = [
  NodeModulesPolyfillPlugin(),
  NodeGlobalsPolyfillPlugin({
    buffer: true,
    process: true,
  }),
];

// Browser bundle (ESM) - uses browser.js entry point which excludes XCFPNGImage
await esbuild.build({
  entryPoints: ["dist/browser.js"],
  bundle: true,
  format: "esm",
  outfile: "dist/xcfreader.browser.mjs",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  sourcemap: true,
  plugins: browserPlugins,
  define: {
    "process.env.NODE_ENV": '"production"',
    global: "globalThis",
  },
  banner: {
    js: "/* xcfreader - Browser Bundle - MIT License */",
  },
});

// Browser bundle (IIFE for script tag)
await esbuild.build({
  entryPoints: ["dist/browser.js"],
  bundle: true,
  format: "iife",
  globalName: "XCFReader",
  outfile: "dist/xcfreader.browser.js",
  platform: "browser",
  target: ["es2022"],
  minify: true,
  sourcemap: true,
  plugins: browserPlugins,
  define: {
    "process.env.NODE_ENV": '"production"',
    global: "globalThis",
  },
  banner: {
    js: "/* xcfreader - Browser Bundle - MIT License */",
  },
});

console.log("Browser bundles built successfully:");
console.log("  - dist/xcfreader.browser.mjs (ESM)");
console.log("  - dist/xcfreader.browser.js (IIFE)");
console.log("");
console.log("Note: XCFPNGImage is excluded from browser builds.");
console.log("      Use XCFDataImage instead for browser rendering.");
