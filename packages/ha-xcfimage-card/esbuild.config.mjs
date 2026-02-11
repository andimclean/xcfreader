import * as esbuild from "esbuild";

// Build main card with code splitting (ESM format required for dynamic imports)
await esbuild.build({
  entryPoints: ["src/ha-xcfimage-card.ts"],
  bundle: true,
  outdir: "dist",
  format: "esm",
  target: "es2022",
  minify: true,
  treeShaking: true,
  sourcemap: true,
  splitting: true, // Enable code splitting for dynamic imports
  chunkNames: "chunks/[name]-[hash]",
  loader: {
    ".ts": "ts",
  },
  // Advanced minification
  drop: ["debugger"],
});

console.log("✅ Built ha-xcfimage-card.js (ESM bundle with code splitting)");
console.log("   - Main bundle: dist/ha-xcfimage-card.js");
console.log("   - Editor chunk loaded on-demand (lazy)");
