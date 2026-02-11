import * as fs from "fs";
import * as path from "path";

/**
 * Creates a minimal valid XCF file for testing
 * This is a very basic XCF file with minimal structure
 */
export function createTestXcfFile(outputPath: string): void {
  // This is a minimal XCF file header for testing
  // Real XCF files are much more complex, but this is enough for basic tests
  const header = Buffer.from([
    // Magic number: "gimp xcf "
    0x67, 0x69, 0x6d, 0x70, 0x20, 0x78, 0x63, 0x66, 0x20,
    // Version: "file"
    0x66, 0x69, 0x6c, 0x65, 0x00,
    // Width: 100 (32-bit big-endian)
    0x00, 0x00, 0x00, 0x64,
    // Height: 100 (32-bit big-endian)
    0x00, 0x00, 0x00, 0x64,
    // Base type: RGB (0)
    0x00, 0x00, 0x00, 0x00,
  ]);

  // Write the file
  fs.writeFileSync(outputPath, header);
}

/**
 * Get the path to test fixtures directory
 */
export function getFixturesPath(): string {
  return path.join(__dirname, "../../../test-fixtures");
}

/**
 * Ensure fixtures directory exists
 */
export function ensureFixturesDir(): void {
  const fixturesPath = getFixturesPath();
  if (!fs.existsSync(fixturesPath)) {
    fs.mkdirSync(fixturesPath, { recursive: true });
  }
}

/**
 * Clean up test fixtures
 */
export function cleanupFixtures(): void {
  const fixturesPath = getFixturesPath();
  if (fs.existsSync(fixturesPath)) {
    fs.rmSync(fixturesPath, { recursive: true, force: true });
  }
}
