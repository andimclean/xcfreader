import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./tests",
  webServer: {
    command: "npx serve . -l 3333",
    port: 3333,
    reuseExistingServer: false,
    cwd: path.resolve(__dirname, "../.."),
  },
  // Screenshot comparison settings
  expect: {
    toHaveScreenshot: {
      // Allow small visual differences (antialiasing, font rendering)
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  // Test multiple browsers
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Enable V8 coverage collection for Chromium only
        contextOptions: {
          recordVideo: undefined,
        },
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  use: {
    baseURL: "http://localhost:3333",
  },
});
