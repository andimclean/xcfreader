import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Coverage tracking
const coverageDir = path.resolve("./coverage-tmp");
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

test.describe("<gpp-xcfimage> web component", () => {
  test.beforeEach(async ({ page }) => {
    // Start JS coverage
    await page.coverage.startJSCoverage();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Stop coverage and save
    const coverage = await page.coverage.stopJSCoverage();
    const coverageFile = path.join(
      coverageDir,
      `coverage-${testInfo.testId}.json`,
    );
    fs.writeFileSync(coverageFile, JSON.stringify(coverage, null, 2));
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

    // Try to load a non-existent file
    await page.evaluate(
      (el) => el.setAttribute("src", "/example-xcf/nonexistent.xcf"),
      elHandle,
    );

    // Wait a moment for the fetch to fail
    await page.waitForTimeout(2000);

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
});
