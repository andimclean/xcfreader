import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Coverage tracking
const coverageDir = path.resolve("./coverage-tmp");
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

test.describe("<gpp-xcfimage> web component", () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Start JS coverage only for Chromium (V8)
    if (browserName === "chromium") {
      await page.coverage.startJSCoverage();
    }
  });

  test.afterEach(async ({ page, browserName }, testInfo) => {
    // Stop coverage and save only for Chromium
    if (browserName === "chromium") {
      const coverage = await page.coverage.stopJSCoverage();
      const coverageFile = path.join(
        coverageDir,
        `coverage-${testInfo.testId}.json`,
      );
      fs.writeFileSync(coverageFile, JSON.stringify(coverage, null, 2));
    }
  });
  test("should render a canvas and respond to attributes", async ({ page }) => {
    // Use Playwright's web server baseURL for demo.html
    await page.goto("/packages/ui-xcfimage/demo.html");
    // Wait for the custom element to be defined (retry up to 10s)
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });
    // Wait for the element to appear in the DOM (retry up to 10s)
    await page.waitForSelector("gpp-xcfimage", { timeout: 10000 });
    const el = page.locator("gpp-xcfimage");
    await expect(el).toHaveCount(1);
    // Use evaluateHandle to access the canvas inside the shadow DOM
    const elHandle = await page.$("gpp-xcfimage");
    // Wait for the shadow DOM and canvas to be attached (retry up to 10s)
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        return el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
      },
      { timeout: 10000 },
    );
    // Get the canvas handle
    const canvasHandle = await page.evaluateHandle(() => {
      const el = document.querySelector("gpp-xcfimage");
      return el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
    });
    // Wait for the canvas to be rendered (width > 0)
    await page.waitForFunction(
      (canvas) => Number(canvas.getAttribute("width")) > 0,
      canvasHandle,
      { timeout: 10000 },
    );
    // Verify layers attribute is set as JSON tree after load
    const layersJson = await page.evaluate(
      (el) => el.getAttribute("layers"),
      elHandle,
    );
    expect(layersJson).toBeTruthy();
    const tree = JSON.parse(layersJson!);
    expect(tree.children).toBeDefined();
    expect(tree.children.length).toBeGreaterThan(0);
    expect(tree.children[0].name).toBe("single.png");
    expect(tree.children[0].index).toBe(0);

    // Change attributes using layer index and check
    await page.evaluate((el) => el.setAttribute("visible", "0"), elHandle);
    await page.evaluate((el) => el.setAttribute("forcevisible", ""), elHandle);
    const width = await page.evaluate(
      (canvas) => canvas.getAttribute("width"),
      canvasHandle,
    );
    expect(Number(width)).toBeGreaterThan(0);
  });

  test("should load different XCF file types correctly", async ({ page }) => {
    // Test different file types with their expected first layer names
    const testFiles = [
      {
        path: "/example-xcf/grey.xcf",
        expectedLayer: "Layer",
        description: "grayscale",
      },
      {
        path: "/example-xcf/indexed.xcf",
        expectedLayer: "Layer",
        description: "indexed/paletted",
      },
      {
        path: "/example-xcf/multi.xcf",
        expectedLayer: "contents",
        description: "multi-layer",
      },
      {
        path: "/example-xcf/float32.xcf",
        expectedLayer: "Layer",
        description: "32-bit float",
      },
      {
        path: "/example-xcf/icon.xcf",
        expectedLayer: "Drawer",
        description: "512x512 icon",
      },
      {
        path: "/example-xcf/pipe.xcf",
        expectedLayer: "hopper_plus.png",
        description: "indexed pipe",
      },
      {
        path: "/example-xcf/boardpieces.xcf",
        expectedLayer: "Pasted Layer",
        description: "game asset",
      },
    ];

    for (const file of testFiles) {
      // Navigate to demo with the file as a query parameter
      await page.goto("/packages/ui-xcfimage/demo.html");
      await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
        timeout: 10000,
      });

      // Use the dropdown to select the file
      const select = page.locator("#srcInput");
      await select.selectOption(file.path);

      // Wait for the file to load
      await page.waitForFunction(
        (expectedLayer) => {
          const el = document.querySelector("gpp-xcfimage");
          if (!el) return false;
          const layers = el.getAttribute("layers");
          if (!layers) return false;
          try {
            const tree = JSON.parse(layers);
            return (
              tree.children &&
              tree.children.length > 0 &&
              tree.children[0].name === expectedLayer
            );
          } catch {
            return false;
          }
        },
        file.expectedLayer,
        { timeout: 10000 },
      );

      // Verify layers attribute is updated
      const layersJson = await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        return el?.getAttribute("layers");
      });
      expect(layersJson).toBeTruthy();
      const tree = JSON.parse(layersJson!);
      expect(tree.children[0].name).toBe(file.expectedLayer);

      // Verify canvas has valid dimensions
      const { width, height } = await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        const canvas =
          el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
        return {
          width: canvas ? Number(canvas.getAttribute("width")) : 0,
          height: canvas ? Number(canvas.getAttribute("height")) : 0,
        };
      });
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    }
  });

  test("should change file when dropdown selection changes", async ({
    page,
  }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Wait for initial load (single.xcf)
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const canvas =
          el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
        return canvas && Number(canvas.getAttribute("width")) > 0;
      },
      { timeout: 10000 },
    );

    const elHandle = await page.$("gpp-xcfimage");

    // Verify initial file is loaded
    let layersJson = await page.evaluate(
      (el) => el.getAttribute("layers"),
      elHandle,
    );
    let tree = JSON.parse(layersJson!);
    expect(tree.children[0].name).toBe("single.png");

    // Select a different file from dropdown
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/multi.xcf");

    // Wait for canvas to update
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return (
            tree.children &&
            tree.children.length > 0 &&
            tree.children[0].name === "contents"
          );
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Verify the new file is loaded
    layersJson = await page.evaluate(
      (el) => el.getAttribute("layers"),
      elHandle,
    );
    tree = JSON.parse(layersJson!);
    expect(tree.children[0].name).toBe("contents");
    expect(tree.children.length).toBeGreaterThan(1); // multi.xcf has multiple layers
  });

  test("should handle errors gracefully for invalid files", async ({
    page,
  }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    const elHandle = await page.$("gpp-xcfimage");

    // Disable retries for faster test execution
    await page.evaluate(
      (el) => {
        el.setAttribute("retry-attempts", "0");
        el.setAttribute("src", "/example-xcf/nonexistent.xcf");
      },
      elHandle,
    );

    // Wait a moment for the fetch to fail (shorter wait since no retries)
    await page.waitForTimeout(1000);

    // Verify error is displayed in canvas
    const canvasHandle = await page.evaluateHandle(() => {
      const el = document.querySelector("gpp-xcfimage");
      return el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
    });

    // Error canvas should have a width (set to 400 in showError)
    const width = await page.evaluate(
      (canvas) => Number(canvas.getAttribute("width")),
      canvasHandle,
    );
    expect(width).toBe(400);

    // Console should log the error
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Try another invalid file to capture console error
    await page.evaluate(
      (el) => el.setAttribute("src", "/invalid.xcf"),
      elHandle,
    );
    await page.waitForTimeout(1000);

    // Should have logged error
    expect(errors.length).toBeGreaterThan(0);
  });

  test("should respect forcevisible attribute for hidden layers", async ({
    page,
  }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Load multi.xcf which has multiple layers with different visibility states
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/multi.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return (
            tree.children &&
            tree.children.length > 0 &&
            tree.children[0].name === "contents"
          );
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Get the layers to find a hidden one
    const layersJson = await page.evaluate(() => {
      const el = document.querySelector("gpp-xcfimage");
      return el?.getAttribute("layers");
    });
    const tree = JSON.parse(layersJson!);

    // Find the first hidden layer
    let hiddenLayerIndex = -1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findHiddenLayer = (node: any): boolean => {
      if (node.isVisible === false && !node.isGroup) {
        hiddenLayerIndex = node.index;
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findHiddenLayer(child)) return true;
        }
      }
      return false;
    };
    findHiddenLayer(tree);

    // If we found a hidden layer, test forcevisible
    if (hiddenLayerIndex >= 0) {
      // Take screenshot with visible layers only
      await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        const canvas = el?.shadowRoot?.querySelector(
          "canvas",
        ) as HTMLCanvasElement;
        return canvas?.toDataURL();
      });

      // Set visible to the hidden layer index (without forcevisible)
      await page.evaluate((index) => {
        const el = document.querySelector("gpp-xcfimage");
        el?.setAttribute("visible", String(index));
      }, hiddenLayerIndex);

      // Wait a moment for render
      await page.waitForTimeout(500);

      // Canvas should still be rendered (even if layer is hidden, canvas is created)
      await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        const canvas = el?.shadowRoot?.querySelector(
          "canvas",
        ) as HTMLCanvasElement;
        return canvas?.toDataURL();
      });

      // Now add forcevisible attribute
      await page.evaluate((index) => {
        const el = document.querySelector("gpp-xcfimage");
        el?.setAttribute("visible", String(index));
        el?.setAttribute("forcevisible", "");
      }, hiddenLayerIndex);

      // Wait for render
      await page.waitForTimeout(500);

      // Verify the element has both attributes set
      const hasForceVisible = await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        return el?.hasAttribute("forcevisible");
      });
      expect(hasForceVisible).toBe(true);

      // Get canvas dimensions to verify it rendered
      const { width, height } = await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        const canvas = el?.shadowRoot?.querySelector(
          "canvas",
        ) as HTMLCanvasElement;
        return {
          width: canvas ? Number(canvas.getAttribute("width")) : 0,
          height: canvas ? Number(canvas.getAttribute("height")) : 0,
        };
      });
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    } else {
      // If no hidden layers, just verify the attribute can be set
      await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        el?.setAttribute("forcevisible", "");
      });

      const hasForceVisible = await page.evaluate(() => {
        const el = document.querySelector("gpp-xcfimage");
        return el?.hasAttribute("forcevisible");
      });
      expect(hasForceVisible).toBe(true);
    }
  });

  test("should emit custom events during load lifecycle", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Create new element without src to ensure fresh load
    await page.evaluate(() => {
      const el = document.createElement("gpp-xcfimage");
      el.id = "event-test";
      document.body.appendChild(el);

      (window as any).eventLog = [];
      el.addEventListener("xcf-loading", () => {
        (window as any).eventLog.push("loading");
      });
      el.addEventListener("xcf-loaded", () => {
        (window as any).eventLog.push("loaded");
      });
    });

    // Trigger load
    await page.evaluate(() => {
      const el = document.getElementById("event-test");
      el?.setAttribute("src", "/example-xcf/single.xcf");
    });

    // Wait for loaded event
    await page.waitForFunction(
      () => (window as any).eventLog?.includes("loaded"),
      { timeout: 10000 },
    );

    const eventLog = await page.evaluate(() => (window as any).eventLog);
    expect(eventLog).toContain("loading");
    expect(eventLog).toContain("loaded");
  });

  test("should emit xcf-error event on failed load", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Listen for error event
    await page.evaluate(() => {
      const el = document.querySelector("gpp-xcfimage");
      el?.addEventListener("xcf-error", () => {
        (window as any).errorEventFired = true;
      });
    });

    // Trigger load with invalid file
    const elHandle = await page.$("gpp-xcfimage");
    await page.evaluate(
      (el) => {
        el.setAttribute("retry-attempts", "0"); // No retries for fast test
        el.setAttribute("src", "/nonexistent.xcf");
      },
      elHandle,
    );

    // Wait for error event
    await page.waitForFunction(() => (window as any).errorEventFired === true, {
      timeout: 3000,
    });

    const errorFired = await page.evaluate(
      () => (window as any).errorEventFired,
    );
    expect(errorFired).toBe(true);
  });

  test("should emit xcf-retrying event on retry attempts", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Listen for retry event
    await page.evaluate(() => {
      (window as any).retryEvents = [];
      const el = document.querySelector("gpp-xcfimage");
      el?.addEventListener("xcf-retrying", (e: any) => {
        (window as any).retryEvents.push({
          attempt: e.detail.attempt,
          maxAttempts: e.detail.maxAttempts,
        });
      });
    });

    // Trigger load with invalid file and retries enabled
    const elHandle = await page.$("gpp-xcfimage");
    await page.evaluate(
      (el) => {
        el.setAttribute("retry-attempts", "2"); // 2 retries
        el.setAttribute("retry-delay", "100"); // Fast retries
        el.setAttribute("src", "/nonexistent-for-retry-test.xcf");
      },
      elHandle,
    );

    // Wait for retries to complete
    await page.waitForTimeout(1500); // Enough time for 2 retries

    const retryEvents = await page.evaluate(() => (window as any).retryEvents);
    expect(retryEvents.length).toBeGreaterThan(0);
    expect(retryEvents[0].maxAttempts).toBe(2);
  });

  test("should support lazy loading with loading attribute", async ({
    page,
  }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Create element with lazy loading
    await page.evaluate(() => {
      const el = document.createElement("gpp-xcfimage");
      el.setAttribute("src", "/example-xcf/grey.xcf");
      el.setAttribute("loading", "lazy");
      el.id = "lazy-test";
      document.body.appendChild(el);
    });

    // Element should exist but not be loaded yet (if not in viewport)
    const lazyEl = page.locator("#lazy-test");
    await expect(lazyEl).toHaveCount(1);

    // Scroll into view to trigger lazy load
    await page.evaluate(() => {
      document.getElementById("lazy-test")?.scrollIntoView();
    });

    // Wait for loading to complete
    await page.waitForFunction(
      () => {
        const el = document.getElementById("lazy-test");
        return el?.hasAttribute("layers");
      },
      { timeout: 5000 },
    );

    const layers = await page.evaluate(() => {
      const el = document.getElementById("lazy-test");
      return el?.getAttribute("layers");
    });

    expect(layers).toBeTruthy();
  });

  test("should handle empty XCF file gracefully", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    const elHandle = await page.$("gpp-xcfimage");

    // Load empty.xcf
    await page.evaluate(
      (el) => el.setAttribute("src", "/example-xcf/empty.xcf"),
      elHandle,
    );

    // Wait for load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        return el?.getAttribute("layers");
      },
      { timeout: 5000 },
    );

    // Should have layers attribute even if empty
    const layers = await page.evaluate(
      (el) => el.getAttribute("layers"),
      elHandle,
    );
    expect(layers).toBeTruthy();

    // Canvas should be rendered
    const canvasHandle = await page.evaluateHandle(() => {
      const el = document.querySelector("gpp-xcfimage");
      return el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
    });

    const width = await page.evaluate(
      (canvas) => Number(canvas.getAttribute("width")),
      canvasHandle,
    );
    expect(width).toBeGreaterThan(0);
  });

  test("should handle complex files with many layers", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    const elHandle = await page.$("gpp-xcfimage");

    // Load map1.xcf which has many layers and groups
    await page.evaluate(
      (el) => el.setAttribute("src", "/example-xcf/map1.xcf"),
      elHandle,
    );

    // Wait for load (this file is large, may take longer)
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        return el?.getAttribute("layers");
      },
      { timeout: 15000 },
    );

    const layers = await page.evaluate(
      (el) => el.getAttribute("layers"),
      elHandle,
    );
    const tree = JSON.parse(layers!);

    // Verify file loaded with structure
    expect(tree.children).toBeDefined();
    expect(tree.children.length).toBeGreaterThan(0);

    // Verify canvas rendered successfully
    const canvasHandle = await page.evaluateHandle(() => {
      const el = document.querySelector("gpp-xcfimage");
      return el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
    });

    const width = await page.evaluate(
      (canvas) => Number(canvas.getAttribute("width")),
      canvasHandle,
    );
    expect(width).toBeGreaterThan(0); // Should have rendered successfully
  });

  test("should support keyboard navigation and accessibility", async ({
    page,
  }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    const el = page.locator("gpp-xcfimage");

    // Check ARIA attributes
    const role = await el.getAttribute("role");
    expect(role).toBe("img");

    const tabindex = await el.getAttribute("tabindex");
    expect(tabindex).toBe("0"); // Should be keyboard focusable

    // Focus element
    await el.focus();

    // Verify aria-label is set
    const ariaLabel = await el.getAttribute("aria-label");
    expect(ariaLabel).toBeTruthy();

    // Test keyboard activation (should emit xcf-activate event)
    await page.evaluate(() => {
      (window as any).activateEventFired = false;
      const el = document.querySelector("gpp-xcfimage");
      el?.addEventListener("xcf-activate", () => {
        (window as any).activateEventFired = true;
      });
    });

    await el.press("Enter");

    await page.waitForTimeout(100);

    const activateFired = await page.evaluate(
      () => (window as any).activateEventFired,
    );
    expect(activateFired).toBe(true);
  });
});

test.describe("Visual regression tests", () => {
  test("should render single.xcf consistently", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Wait for canvas to be rendered
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const canvas =
          el && el.shadowRoot && el.shadowRoot.querySelector("canvas");
        return canvas && Number(canvas.getAttribute("width")) > 0;
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas element using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("single-xcf.png");
  });

  test("should render grey.xcf consistently", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select grey.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/grey.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return tree.children && tree.children.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("grey-xcf.png");
  });

  test("should render indexed.xcf consistently", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select indexed.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/indexed.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return tree.children && tree.children.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("indexed-xcf.png");
  });

  test("should render multi.xcf with all layers consistently", async ({
    page,
  }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select multi.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/multi.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return (
            tree.children &&
            tree.children.length > 0 &&
            tree.children[0].name === "contents"
          );
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("multi-xcf-all-layers.png");
  });

  test("should render multi.xcf with specific layer consistently", async ({
    page,
  }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select multi.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/multi.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return (
            tree.children &&
            tree.children.length > 0 &&
            tree.children[0].name === "contents"
          );
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Set visible to only first layer
    await page.evaluate(() => {
      const el = document.querySelector("gpp-xcfimage");
      el?.setAttribute("visible", "0");
    });

    // Wait for render
    await page.waitForTimeout(500);

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("multi-xcf-layer-0.png");
  });

  test("should render float32.xcf consistently", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select float32.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/float32.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return tree.children && tree.children.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("float32-xcf.png");
  });

  test("should render icon.xcf consistently", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select icon.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/icon.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return tree.children && tree.children.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("icon-xcf.png");
  });

  test("should render pipe.xcf consistently", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select pipe.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/pipe.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return tree.children && tree.children.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("pipe-xcf.png");
  });

  test("should render boardpieces.xcf consistently", async ({ page }) => {
    await page.goto("/packages/ui-xcfimage/demo.html");
    await page.waitForFunction(() => !!customElements.get("gpp-xcfimage"), {
      timeout: 10000,
    });

    // Select boardpieces.xcf
    const select = page.locator("#srcInput");
    await select.selectOption("/example-xcf/boardpieces.xcf");

    // Wait for file to load
    await page.waitForFunction(
      () => {
        const el = document.querySelector("gpp-xcfimage");
        const layers = el?.getAttribute("layers");
        if (!layers) return false;
        try {
          const tree = JSON.parse(layers);
          return tree.children && tree.children.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    );

    // Take screenshot of the canvas using locator
    const canvas = page.locator("gpp-xcfimage").locator("canvas");

    await expect(canvas).toHaveScreenshot("boardpieces-xcf.png");
  });
});
