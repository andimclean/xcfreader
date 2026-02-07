import * as esbuild from "esbuild";

// Build main card bundle with all dependencies
await esbuild.build({
  entryPoints: ["src/ha-xcfimage-card.ts"],
  bundle: true,
  outfile: "dist/ha-xcfimage-card.js",
  format: "iife",
  target: "es2020",
  minify: false,
  sourcemap: true,
  loader: {
    ".ts": "ts",
  },
});

// Build editor bundle with all dependencies
await esbuild.build({
  entryPoints: ["src/ha-xcfimage-card-editor.ts"],
  bundle: true,
  outfile: "dist/ha-xcfimage-card-editor.js",
  format: "esm",
  target: "es2020",
  minify: false,
  sourcemap: true,
  loader: {
    ".ts": "ts",
  },
});

console.log("Built ha-xcfimage-card.js (IIFE bundle)");
console.log("Built ha-xcfimage-card-editor.js (ESM bundle)");
