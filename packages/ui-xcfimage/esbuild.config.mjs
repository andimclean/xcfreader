import { build } from 'esbuild';

// Build both ESM and IIFE bundles for browser compatibility
build({
  entryPoints: ['./src/gpp-xcfimage.ts'],
  bundle: true,
  minify: false,
  sourcemap: true,
  format: 'iife',
  globalName: 'GPpXCFImage',
  outfile: './dist/gpp-xcfimage.iife.js',
  target: ['es2020'],
  external: [],
}).catch(() => process.exit(1));

// Optionally, keep the ESM build for module usage
build({
  entryPoints: ['./src/gpp-xcfimage.ts'],
  bundle: true,
  minify: false,
  sourcemap: true,
  format: 'esm',
  outfile: './dist/gpp-xcfimage.js',
  target: ['es2020'],
  external: [],
}).catch(() => process.exit(1));
