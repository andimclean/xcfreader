/**
 * Phase 2 Performance Benchmark
 * Measures rendering performance after Phase 2 optimizations
 */

import path from "path";
import { fileURLToPath } from "url";
import { XCFParser, XCFPNGImage } from "./dist/node.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  { name: "fullColour.xcf", path: "../../example-xcf/fullColour.xcf", iterations: 10 },
  { name: "grey.xcf", path: "../../example-xcf/grey.xcf", iterations: 10 },
  { name: "indexed.xcf", path: "../../example-xcf/indexed.xcf", iterations: 10 },
];

console.log("Phase 2 Performance Benchmark");
console.log("=============================\n");

let totalParseTime = 0;
let totalRenderTime = 0;

for (const test of testFiles) {
  const filePath = path.resolve(__dirname, test.path);

  // Warm-up run
  const warmupParser = await XCFParser.parseFileAsync(filePath);
  const warmupImage = new XCFPNGImage(warmupParser.width, warmupParser.height);
  warmupParser.createImage(warmupImage);

  // Benchmark parsing only
  const parseTimes = [];
  for (let i = 0; i < test.iterations; i++) {
    const start = performance.now();
    await XCFParser.parseFileAsync(filePath);
    const end = performance.now();
    parseTimes.push(end - start);
  }
  const avgParseTime = parseTimes.reduce((a, b) => a + b, 0) / test.iterations;

  // Benchmark rendering only (on pre-parsed instance)
  const renderTimes = [];
  for (let i = 0; i < test.iterations; i++) {
    const parser = await XCFParser.parseFileAsync(filePath);
    const image = new XCFPNGImage(parser.width, parser.height);
    const start = performance.now();
    parser.createImage(image);
    const end = performance.now();
    renderTimes.push(end - start);
  }
  const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / test.iterations;

  console.log(`${test.name}:`);
  console.log(`  Parse:  ${avgParseTime.toFixed(2)}ms`);
  console.log(`  Render: ${avgRenderTime.toFixed(2)}ms`);
  console.log(`  Total:  ${(avgParseTime + avgRenderTime).toFixed(2)}ms\n`);

  totalParseTime += avgParseTime;
  totalRenderTime += avgRenderTime;
}

console.log("Summary:");
console.log(`  Total parse:  ${totalParseTime.toFixed(2)}ms`);
console.log(`  Total render: ${totalRenderTime.toFixed(2)}ms`);
console.log(`  Grand total:  ${(totalParseTime + totalRenderTime).toFixed(2)}ms`);

console.log("\n✓ Benchmark complete");
