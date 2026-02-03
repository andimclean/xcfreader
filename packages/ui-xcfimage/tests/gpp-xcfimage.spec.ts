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
    // Change attributes and check
    await page.evaluate(el => el.setAttribute('visible', 'single.png'), elHandle);
    await page.evaluate(el => el.setAttribute('forcevisible', ''), elHandle);
    // Optionally, check canvas size or other effects
    const width = await page.evaluate(canvas => canvas.getAttribute('width'), canvasHandle);
    expect(Number(width)).toBeGreaterThan(0);
    // (Duplicate code removed)
  });
});
