#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 *
 * Checks bundle sizes for ui-xcfimage and ha-xcfimage-card packages.
 * Compares against baseline sizes and warns if bundles exceed thresholds.
 *
 * Usage:
 *   node scripts/check-bundle-size.mjs              # Check current sizes
 *   node scripts/check-bundle-size.mjs --baseline   # Update baseline
 *   node scripts/check-bundle-size.mjs --ci         # Fail in CI if size increases
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gzipSync } from "zlib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// Bundle size configuration
const BUNDLES = [
  {
    name: "ui-xcfimage (IIFE minified)",
    path: "packages/ui-xcfimage/dist/gpp-xcfimage.iife.min.js",
    maxSize: 120 * 1024, // 120KB raw
    maxGzip: 40 * 1024, // 40KB gzipped
  },
  {
    name: "ui-xcfimage (ESM)",
    path: "packages/ui-xcfimage/dist/gpp-xcfimage.js",
    maxSize: 200 * 1024, // 200KB raw (not minified)
    maxGzip: 50 * 1024, // 50KB gzipped
  },
  {
    name: "ha-xcfimage-card (main)",
    path: "packages/ha-xcfimage-card/dist/ha-xcfimage-card.js",
    maxSize: 15 * 1024, // 15KB raw
    maxGzip: 5 * 1024, // 5KB gzipped
  },
  {
    name: "ha-xcfimage-card (editor)",
    path: "packages/ha-xcfimage-card/dist/ha-xcfimage-card-editor.js",
    maxSize: 25 * 1024, // 25KB raw
    maxGzip: 8 * 1024, // 8KB gzipped
  },
];

const BASELINE_FILE = path.join(ROOT, ".bundle-size-baseline.json");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatDiff(current, baseline) {
  if (!baseline) return "";
  const diff = current - baseline;
  const percent = ((diff / baseline) * 100).toFixed(1);
  if (diff === 0) return `${colors.cyan}(no change)${colors.reset}`;
  if (diff > 0) {
    return `${colors.red}+${formatBytes(diff)} (+${percent}%)${colors.reset}`;
  }
  return `${colors.green}${formatBytes(diff)} (${percent}%)${colors.reset}`;
}

function getBundleSize(bundlePath) {
  const fullPath = path.join(ROOT, bundlePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath);
  const raw = content.length;
  const gzip = gzipSync(content).length;

  return { raw, gzip };
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(BASELINE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveBaseline(data) {
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(data, null, 2) + "\n");
  console.log(`${colors.green}✓${colors.reset} Baseline saved to ${BASELINE_FILE}`);
}

function checkBundles(options = {}) {
  const { updateBaseline = false, ci = false } = options;

  console.log(`${colors.bright}${colors.blue}📦 Bundle Size Analysis${colors.reset}\n`);

  const baseline = loadBaseline();
  const results = {};
  let hasErrors = false;
  let hasWarnings = false;

  for (const bundle of BUNDLES) {
    const sizes = getBundleSize(bundle.path);

    if (!sizes) {
      console.log(`${colors.yellow}⚠${colors.reset}  ${bundle.name}`);
      console.log(`   ${colors.yellow}Bundle not found: ${bundle.path}${colors.reset}\n`);
      continue;
    }

    results[bundle.name] = sizes;

    const baselineSizes = baseline[bundle.name];
    const rawDiff = formatDiff(sizes.raw, baselineSizes?.raw);
    const gzipDiff = formatDiff(sizes.gzip, baselineSizes?.gzip);

    // Check if size exceeds limits
    const rawExceeds = sizes.raw > bundle.maxSize;
    const gzipExceeds = sizes.gzip > bundle.maxGzip;

    let status = `${colors.green}✓${colors.reset}`;
    if (rawExceeds || gzipExceeds) {
      status = `${colors.red}✗${colors.reset}`;
      hasErrors = true;
    }

    console.log(`${status}  ${colors.bright}${bundle.name}${colors.reset}`);
    console.log(`   Raw:  ${formatBytes(sizes.raw)} / ${formatBytes(bundle.maxSize)} ${rawDiff}`);
    console.log(`   Gzip: ${formatBytes(sizes.gzip)} / ${formatBytes(bundle.maxGzip)} ${gzipDiff}`);

    if (rawExceeds) {
      const excess = sizes.raw - bundle.maxSize;
      console.log(
        `   ${colors.red}Error: Raw size exceeds limit by ${formatBytes(excess)}${colors.reset}`
      );
    }
    if (gzipExceeds) {
      const excess = sizes.gzip - bundle.maxGzip;
      console.log(
        `   ${colors.red}Error: Gzip size exceeds limit by ${formatBytes(excess)}${colors.reset}`
      );
    }

    // Warn if size increased by more than 5%
    if (baselineSizes && !updateBaseline && !ci) {
      const rawIncrease = ((sizes.raw - baselineSizes.raw) / baselineSizes.raw) * 100;
      const gzipIncrease = ((sizes.gzip - baselineSizes.gzip) / baselineSizes.gzip) * 100;

      if (rawIncrease > 5 || gzipIncrease > 5) {
        console.log(
          `   ${colors.yellow}Warning: Bundle size increased by more than 5%${colors.reset}`
        );
        hasWarnings = true;
      }
    }

    console.log("");
  }

  if (updateBaseline) {
    saveBaseline(results);
  }

  // Summary
  if (hasErrors) {
    console.log(`${colors.red}${colors.bright}Bundle size check failed!${colors.reset}`);
    console.log(`${colors.red}One or more bundles exceed the size limits.${colors.reset}\n`);
    if (ci) {
      process.exit(1);
    }
  } else if (hasWarnings) {
    console.log(
      `${colors.yellow}${colors.bright}Bundle size check passed with warnings${colors.reset}\n`
    );
  } else {
    console.log(`${colors.green}${colors.bright}✓ All bundles within size limits${colors.reset}\n`);
  }

  return { hasErrors, hasWarnings };
}

// Parse command line arguments
const args = process.argv.slice(2);
const updateBaseline = args.includes("--baseline");
const ci = args.includes("--ci");

checkBundles({ updateBaseline, ci });
