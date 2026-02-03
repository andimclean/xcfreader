import { test, expect } from '@playwright/test';


test.describe('<gpp-xcfimage> web component', () => {
  test('should render a canvas and respond to attributes', async ({ page }) => {
    // Use Playwright's web server baseURL for demo.html
    await page.goto('/packages/ui-xcfimage/demo.html');
    // Wait for the custom element to be defined (retry up to 10s)
    // Wait for the custom element to be defined (retry up to 10s)
    await page.waitForFunction(() => !!customElements.get('gpp-xcfimage'), { timeout: 10000 });
    // Wait for the element to appear in the DOM (retry up to 10s)
    await page.waitForSelector('gpp-xcfimage', { timeout: 10000 });
    const el = page.locator('gpp-xcfimage');
    await expect(el).toHaveCount(1);
    // Use evaluateHandle to access the canvas inside the shadow DOM
    const elHandle = await page.$('gpp-xcfimage');
    // Wait for the shadow DOM and canvas to be attached (retry up to 10s)
    await page.waitForFunction(() => {
      const el = document.querySelector('gpp-xcfimage');
      return el && el.shadowRoot && el.shadowRoot.querySelector('canvas');
    }, { timeout: 10000 });
    // Get the canvas handle
    const canvasHandle = await page.evaluateHandle(() => {
      const el = document.querySelector('gpp-xcfimage');
      return el && el.shadowRoot && el.shadowRoot.querySelector('canvas');
    });
    // Wait for the canvas to be rendered (width > 0)
    await page.waitForFunction(canvas => Number(canvas.getAttribute('width')) > 0, canvasHandle, { timeout: 10000 });
    // Verify layers attribute is set as JSON tree after load
    const layersJson = await page.evaluate(el => el.getAttribute('layers'), elHandle);
    expect(layersJson).toBeTruthy();
    const tree = JSON.parse(layersJson!);
    expect(tree.children).toBeDefined();
    expect(tree.children.length).toBeGreaterThan(0);
    expect(tree.children[0].name).toBe('single.png');
    expect(tree.children[0].index).toBe(0);

    // Change attributes using layer index and check
    await page.evaluate(el => el.setAttribute('visible', '0'), elHandle);
    await page.evaluate(el => el.setAttribute('forcevisible', ''), elHandle);
    const width = await page.evaluate(canvas => canvas.getAttribute('width'), canvasHandle);
    expect(Number(width)).toBeGreaterThan(0);
  });
});
