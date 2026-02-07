import { XCFParser, XCFPNGImage } from "../node.js";
import { Logger } from "../lib/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BenchmarkResult {
  name: string;
  parseTime: number;
  renderTime: number;
  totalTime: number;
  fileSize: number;
}

interface BenchmarkBaseline {
  version: string;
  date: string;
  results: BenchmarkResult[];
}

interface ComparisonResult {
  name: string;
  current: BenchmarkResult;
  baseline: BenchmarkResult | undefined;
  parseTimeDiff: number;
  renderTimeDiff: number;
  totalTimeDiff: number;
  isRegression: boolean;
}

const REGRESSION_THRESHOLD = 0.20; // 20% slowdown is considered a regression
const BASELINE_FILE = path.resolve(__dirname, "../../benchmark-baseline.json");

async function runBenchmark(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  const files = [
    "single.xcf",
    "multi.xcf",
    "text.xcf",
    "empty.xcf",
    "fullColour.xcf",
    "float32.xcf",
    "int32.xcf",
    "grey.xcf",
    "indexed.xcf",
  ];

  for (const filename of files) {
    const filePath = path.resolve(
      __dirname,
      `../../../../example-xcf/${filename}`,
    );

    // Measure parse time
    const parseStart = performance.now();
    const parser = await XCFParser.parseFileAsync(filePath);
    const parseEnd = performance.now();
    const parseTime = parseEnd - parseStart;

    // Measure render time
    const renderStart = performance.now();
    const image = new XCFPNGImage(parser.width, parser.height);
    parser.createImage(image);
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart;

    const totalTime = parseTime + renderTime;

    // Get file size
    let fileSize = 0;
    try {
      const stat = fs.statSync(filePath);
      fileSize = stat.size;
    } catch (_e) {
      fileSize = parser.width * parser.height * 4;
    }

    results.push({
      name: filename,
      parseTime,
      renderTime,
      totalTime,
      fileSize,
    });
  }

  return results;
}

function loadBaseline(): BenchmarkBaseline | null {
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      const data = fs.readFileSync(BASELINE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    Logger.log(`Warning: Could not load baseline file: ${e}`);
  }
  return null;
}

function saveBaseline(results: BenchmarkResult[]): void {
  const baseline: BenchmarkBaseline = {
    version: "1.0.1",
    date: new Date().toISOString(),
    results,
  };
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2));
  Logger.log(`\nBaseline saved to ${BASELINE_FILE}`);
}

function compareResults(
  current: BenchmarkResult[],
  baseline: BenchmarkBaseline | null,
): ComparisonResult[] {
  if (!baseline) {
    return [];
  }

  return current.map((curr) => {
    const base = baseline.results.find((b) => b.name === curr.name);
    if (!base) {
      return {
        name: curr.name,
        current: curr,
        baseline: undefined,
        parseTimeDiff: 0,
        renderTimeDiff: 0,
        totalTimeDiff: 0,
        isRegression: false,
      };
    }

    const parseTimeDiff = (curr.parseTime - base.parseTime) / base.parseTime;
    const renderTimeDiff =
      (curr.renderTime - base.renderTime) / base.renderTime;
    const totalTimeDiff = (curr.totalTime - base.totalTime) / base.totalTime;

    const isRegression =
      totalTimeDiff > REGRESSION_THRESHOLD ||
      parseTimeDiff > REGRESSION_THRESHOLD ||
      renderTimeDiff > REGRESSION_THRESHOLD;

    return {
      name: curr.name,
      current: curr,
      baseline: base,
      parseTimeDiff,
      renderTimeDiff,
      totalTimeDiff,
      isRegression,
    };
  });
}

function printComparison(comparisons: ComparisonResult[]): void {
  Logger.log("\nPerformance Comparison:");
  Logger.log("─".repeat(100));
  Logger.log(
    "File".padEnd(20) +
      "Parse".padEnd(20) +
      "Render".padEnd(20) +
      "Total".padEnd(20) +
      "Status",
  );
  Logger.log("─".repeat(100));

  for (const comp of comparisons) {
    if (!comp.baseline) {
      Logger.log(`${comp.name.padEnd(20)}${"NEW".padEnd(20)}`);
      continue;
    }

    const parseStr = `${comp.current.parseTime.toFixed(2)}ms (${comp.parseTimeDiff >= 0 ? "+" : ""}${(comp.parseTimeDiff * 100).toFixed(1)}%)`;
    const renderStr = `${comp.current.renderTime.toFixed(2)}ms (${comp.renderTimeDiff >= 0 ? "+" : ""}${(comp.renderTimeDiff * 100).toFixed(1)}%)`;
    const totalStr = `${comp.current.totalTime.toFixed(2)}ms (${comp.totalTimeDiff >= 0 ? "+" : ""}${(comp.totalTimeDiff * 100).toFixed(1)}%)`;
    const status = comp.isRegression ? "⚠️ REGRESSION" : "✅ OK";

    Logger.log(
      comp.name.padEnd(20) +
        parseStr.padEnd(20) +
        renderStr.padEnd(20) +
        totalStr.padEnd(20) +
        status,
    );
  }

  Logger.log("─".repeat(100));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldSaveBaseline = args.includes("--save-baseline");
  const shouldCheckRegression = args.includes("--check-regression");

  Logger.log("Running performance benchmark...\n");

  const results = await runBenchmark();

  // Print current results
  Logger.log("Current Results:");
  Logger.log("─".repeat(80));
  Logger.log(
    "File".padEnd(20) +
      "Parse (ms)".padEnd(15) +
      "Render (ms)".padEnd(15) +
      "Total (ms)".padEnd(15) +
      "Size (KB)",
  );
  Logger.log("─".repeat(80));

  for (const result of results) {
    Logger.log(
      result.name.padEnd(20) +
        result.parseTime.toFixed(2).padEnd(15) +
        result.renderTime.toFixed(2).padEnd(15) +
        result.totalTime.toFixed(2).padEnd(15) +
        (result.fileSize / 1024).toFixed(2),
    );
  }

  Logger.log("─".repeat(80));

  const totalParseTime = results.reduce((sum, r) => sum + r.parseTime, 0);
  const totalRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0);
  const totalTime = totalParseTime + totalRenderTime;

  Logger.log(
    `\nSummary: ${totalParseTime.toFixed(2)}ms parse + ${totalRenderTime.toFixed(2)}ms render = ${totalTime.toFixed(2)}ms total`,
  );

  if (shouldSaveBaseline) {
    saveBaseline(results);
    return;
  }

  // Load baseline and compare
  const baseline = loadBaseline();
  if (baseline) {
    const comparisons = compareResults(results, baseline);
    printComparison(comparisons);

    if (shouldCheckRegression) {
      const regressions = comparisons.filter((c) => c.isRegression);
      if (regressions.length > 0) {
        Logger.error(
          `\n❌ Performance regression detected in ${regressions.length} file(s)!`,
        );
        Logger.error(
          `Threshold: ${(REGRESSION_THRESHOLD * 100).toFixed(0)}% slowdown`,
        );
        process.exit(1);
      } else {
        Logger.log("\n✅ No performance regressions detected");
      }
    }
  } else {
    Logger.log(
      "\nNo baseline found. Run with --save-baseline to create one.",
    );
  }
}

main().catch((err) => {
  Logger.error(err);
  process.exit(1);
});
