import * as esbuild from "esbuild";

// Build standalone bundle with all dependencies
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

console.log("Built ha-xcfimage-card.js (IIFE bundle)");
