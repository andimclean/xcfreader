#!/usr/bin/env node
import * as esbuild from "esbuild";

console.log("🔍 Analyzing bundle sizes...\n");

const packages = [
  {
    name: "xcfreader (browser)",
    entry: "packages/xcfreader/dist/browser.js",
    outfile: "temp-xcfreader-analysis.js",
  },
  {
    name: "ui-xcfimage",
    entry: "packages/ui-xcfimage/src/gpp-xcfimage.ts",
    outfile: "temp-ui-xcfimage-analysis.js",
  },
  {
    name: "ha-xcfimage-card",
    entry: "packages/ha-xcfimage-card/src/ha-xcfimage-card.ts",
    outfile: "temp-ha-xcfimage-card-analysis.js",
  },
];

for (const pkg of packages) {
  try {
    const result = await esbuild.build({
      entryPoints: [pkg.entry],
      bundle: true,
      minify: true,
      metafile: true,
      outfile: pkg.outfile,
      format: "iife",
      target: "es2020",
      external: pkg.name === "xcfreader (browser)" ? [] : [],
      write: false, // Don't write the output file
    });

    console.log(`\n📦 ${pkg.name}`);
    console.log("=".repeat(60));

    // Get output size
    const outputSize = result.outputFiles[0].contents.length;
    console.log(`Total minified size: ${(outputSize / 1024).toFixed(2)} KB`);

    // Show top 10 largest inputs
    const inputs = Object.entries(result.metafile.inputs)
      .map(([file, data]) => ({
        file: file.replace(/^.*node_modules\//, "npm:"),
        bytes: data.bytes,
      }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10);

    console.log("\nTop 10 largest inputs:");
    inputs.forEach((input, i) => {
      const kb = (input.bytes / 1024).toFixed(2);
      console.log(`  ${i + 1}. ${input.file} (${kb} KB)`);
    });

    // Group by package
    const byPackage = {};
    Object.entries(result.metafile.inputs).forEach(([file, data]) => {
      const match = file.match(/node_modules\/(@?[^/]+(?:\/[^/]+)?)/);
      const pkgName = match ? match[1] : "project";
      byPackage[pkgName] = (byPackage[pkgName] || 0) + data.bytes;
    });

    const sortedPackages = Object.entries(byPackage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log("\nTop 5 dependencies by size:");
    sortedPackages.forEach(([name, bytes], i) => {
      const kb = (bytes / 1024).toFixed(2);
      console.log(`  ${i + 1}. ${name} (${kb} KB)`);
    });
  } catch (err) {
    console.error(`❌ Failed to analyze ${pkg.name}:`, err.message);
  }
}

console.log("\n✅ Analysis complete!\n");
