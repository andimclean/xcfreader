import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npx serve . -l 3333',
    port: 3333,
    reuseExistingServer: false,
    cwd: path.resolve(__dirname, '../..'),
  },
  use: {
    baseURL: 'http://localhost:3333',
    ...devices['Desktop Chrome'],
  },
});
