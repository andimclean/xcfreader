import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// List of example XCF files to test in the browser demo
const xcfFiles = [
  'single.xcf',
  'multi.xcf',
  'text.xcf',
  'empty.xcf',
  'fullColour.xcf',
  'float32.xcf',
  'int32.xcf',
  'grey.xcf',
  'indexed.xcf'
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Browser Demo XCF Parsing', () => {
  for (const file of xcfFiles) {
    test(`should parse and display info for ${file}`, async ({ page }) => {
      const demoPath = path.resolve(__dirname, '../examples/browser-demo.html');
      await page.goto('file://' + demoPath + '?debug=1');
      // Upload file using setInputFiles (works for hidden inputs)
      const filePath = path.resolve(__dirname, `../examples/${file}`);
      await page.setInputFiles('input[type=file]', filePath);
      // Wait for file info output
      await page.waitForSelector('#file-info', { timeout: 5000 });
      const infoText = await page.textContent('#file-info');
      expect(infoText).toContain('Layers:');
      expect(infoText).not.toContain('Layers: 0');
    });
  }
});
