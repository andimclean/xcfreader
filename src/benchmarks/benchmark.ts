import { XCFParser } from "../gimpparser.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BenchmarkResult {
  name: string;
  file: string;
  parseTime: number;
  renderTime: number;
  totalTime: number;
  fileSize: number;
}

async function benchmark(): Promise<void> {
  const results: BenchmarkResult[] = [];

  const files = ["single.xcf", "multi.xcf", "text.xcf", "empty.xcf"];

  console.log("Performance Benchmark - xcfreader v0.0.8\n");
  console.log("Parsing and rendering XCF files...\n");

  for (const filename of files) {
    const filePath = path.resolve(__dirname, `../../examples/${filename}`);

    // Measure parse time
    const parseStart = performance.now();
    const parser = await XCFParser.parseFileAsync(filePath);
    const parseEnd = performance.now();
    const parseTime = parseEnd - parseStart;

    // Measure render time
    const renderStart = performance.now();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const image = parser.createImage();
    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart;

    const totalTime = parseTime + renderTime;

    results.push({
      name: filename,
      file: filePath,
      parseTime,
      renderTime,
      totalTime,
      fileSize: parser.width * parser.height * 4, // approximate pixel data
    });
  }

  // Print results
  console.log("Results:");
  console.log("─".repeat(80));
  console.log(
    "File".padEnd(20) +
      "Parse (ms)".padEnd(15) +
      "Render (ms)".padEnd(15) +
      "Total (ms)".padEnd(15) +
      "Size (KB)",
  );
  console.log("─".repeat(80));

  for (const result of results) {
    console.log(
      result.name.padEnd(20) +
        result.parseTime.toFixed(2).padEnd(15) +
        result.renderTime.toFixed(2).padEnd(15) +
        result.totalTime.toFixed(2).padEnd(15) +
        (result.fileSize / 1024).toFixed(2),
    );
  }

  console.log("─".repeat(80));

  const totalParseTime = results.reduce((sum, r) => sum + r.parseTime, 0);
  const totalRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0);
  const totalTime = totalParseTime + totalRenderTime;

  console.log(
    `\nSummary: ${totalParseTime.toFixed(2)}ms parse + ${totalRenderTime.toFixed(2)}ms render = ${totalTime.toFixed(2)}ms total`,
  );
}

benchmark().catch(console.error);
