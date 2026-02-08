import { build } from "esbuild";

// Build IIFE bundle for browser <script> tag usage
build({
  entryPoints: ["./src/gpp-xcfimage.ts"],
  bundle: true,
  minify: false,
  sourcemap: true,
  format: "iife",
  globalName: "GPpXCFImage",
  outfile: "./dist/gpp-xcfimage.iife.js",
  target: ["es2022"],
  external: [],
}).catch(() => process.exit(1));

// Build minified IIFE bundle for production
build({
  entryPoints: ["./src/gpp-xcfimage.ts"],
  bundle: true,
  minify: true,
  treeShaking: true,
  sourcemap: false,
  format: "iife",
  globalName: "GPpXCFImage",
  outfile: "./dist/gpp-xcfimage.iife.min.js",
  target: ["es2022"],
  external: [],
  // Advanced minification
  drop: ["debugger"],
  pure: ["console.log", "console.debug"], // Don't drop console.error - needed for error reporting
}).catch(() => process.exit(1));

// Keep the ESM build for module usage
build({
  entryPoints: ["./src/gpp-xcfimage.ts"],
  bundle: true,
  minify: false,
  sourcemap: true,
  format: "esm",
  outfile: "./dist/gpp-xcfimage.js",
  target: ["es2022"],
  external: [],
}).catch(() => process.exit(1));
