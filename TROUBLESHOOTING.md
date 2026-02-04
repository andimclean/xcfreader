# Troubleshooting Guide

This guide helps you resolve common issues when using xcfreader.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Parsing Errors](#parsing-errors)
- [Browser Issues](#browser-issues)
- [Node.js Issues](#nodejs-issues)
- [Performance Issues](#performance-issues)
- [TypeScript Issues](#typescript-issues)
- [FAQ](#faq)

## Installation Issues

### `pngjs` not found

**Error:**
```
Cannot find module 'pngjs'
```

**Solution:**
If you're using Node.js and want PNG output, install `pngjs`:
```bash
npm install pngjs
```

For browser-only usage, `pngjs` is not needed. Use `XCFDataImage` instead of `XCFPNGImage`.

### Module resolution errors

**Error:**
```
Cannot find module '@theprogrammingiantpanda/xcfreader/node'
```

**Solution:**
Ensure you're using Node.js 18+ and that your `package.json` has:
```json
{
  "type": "module"
}
```

Or use `.mjs` file extensions for ES modules.

## Parsing Errors

### `XCFParseError: Invalid XCF file`

**Cause:** The file is not a valid XCF file or is corrupted.

**Solutions:**
1. Verify the file opens in GIMP
2. Check the file isn't a different format (PNG, JPG, etc.) renamed to `.xcf`
3. Try re-saving the file in GIMP
4. Ensure the file isn't corrupted (check file size, re-download if from network)

### `UnsupportedFormatError`

**Cause:** The XCF file uses features not yet supported by xcfreader.

**Solutions:**
1. Check which GIMP version created the file
2. Try saving the file in GIMP with older compatibility (File → Export As → XCF)
3. Report the issue with the XCF file version info on [GitHub Issues](https://github.com/andimclean/xcfreader/issues)

### File not found errors

**Error:**
```
ENOENT: no such file or directory
```

**Solution:**
Use absolute paths or resolve paths relative to your working directory:
```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const xcfPath = path.resolve(__dirname, './images/file.xcf');

const parser = await XCFParser.parseFileAsync(xcfPath);
```

## Browser Issues

### Canvas errors

**Error:**
```
Failed to get 2D canvas context
```

**Solutions:**
1. Ensure the canvas element exists in the DOM
2. Check that you're calling `getContext('2d')` correctly
3. Verify the browser supports Canvas API (all modern browsers do)

### `toDataURL()` not working

**Error:**
```
toDataURL() requires a browser environment with Canvas support
```

**Cause:** You're calling `toDataURL()` in a Node.js environment.

**Solution:**
- In Node.js, use `XCFPNGImage` and `writeImage()` instead
- In browsers, ensure you're using `XCFDataImage` from the browser bundle

### Large file memory issues

**Symptom:** Browser crashes or becomes unresponsive with large XCF files.

**Solutions:**
1. Use Web Workers to parse files in a background thread
2. Show a loading indicator while parsing
3. Consider reducing image resolution in GIMP before export
4. Split large images into multiple smaller XCF files

## Node.js Issues

### PNG output is blank/black

**Causes:**
1. No visible layers in the XCF file
2. All layers have 0% opacity
3. Layers are outside the canvas bounds

**Solutions:**
1. Check layer visibility in GIMP
2. Verify layer opacity settings
3. Use `parser.layers` to inspect layer properties:
   ```typescript
   parser.layers.forEach(layer => {
     console.log(`${layer.name}: visible=${layer.visible}, opacity=${layer.opacity}`);
   });
   ```

### Image colors look wrong

**Causes:**
1. Grayscale or indexed color mode
2. High bit-depth precision (16-bit, 32-bit)
3. Unusual blend modes

**Solutions:**
1. Check the color mode: `parser.baseType`
2. Check precision: `parser.precision`
3. xcfreader automatically converts to 8-bit RGBA - this is expected behavior

## Performance Issues

### Slow parsing on large files

**Solutions:**
1. Use streaming where possible (future enhancement)
2. Parse files during build time instead of runtime
3. Cache parsed results
4. Consider using lower resolution source files
5. Use the async API: `parseFileAsync()` instead of blocking operations

### High memory usage

**Solutions:**
1. Dispose of parsed objects when done:
   ```typescript
   const parser = await XCFParser.parseFileAsync('./large.xcf');
   const image = new XCFPNGImage(parser.width, parser.height);
   parser.createImage(image);
   await image.writeImage('./output.png');

   // Let garbage collector reclaim memory
   parser = null;
   image = null;
   ```
2. Process files one at a time instead of loading all into memory
3. Use smaller XCF files when possible

## TypeScript Issues

### Type errors with compositing modes

**Error:**
```
Type 'number' is not assignable to type 'CompositerMode'
```

**Solution:**
Use the `CompositerMode` enum instead of numbers:
```typescript
import { CompositerMode } from '@theprogrammingiantpanda/xcfreader';

// Don't do this:
const mode = 3;

// Do this:
const mode = CompositerMode.NORMAL_MODE;
```

### Missing type definitions

**Error:**
```
Could not find declaration file for module '@theprogrammingiantpanda/xcfreader'
```

**Solution:**
1. Ensure you have the latest version installed
2. Check that `node_modules/@theprogrammingiantpanda/xcfreader/dist/*.d.ts` files exist
3. Restart your TypeScript language server / IDE

## FAQ

### Q: Which GIMP versions are supported?

**A:** xcfreader supports:
- GIMP 2.10.x (XCF v011 with 64-bit pointers) ✅
- GIMP 2.8.x (XCF v010 with 32-bit pointers) ✅
- GIMP 2.6.x and earlier ✅

### Q: Can I use xcfreader in React/Vue/Angular?

**A:** Yes! Use the browser bundle:
```typescript
import { XCFParser, XCFDataImage } from '@theprogrammingiantpanda/xcfreader/browser';
```

For React example:
```tsx
function XCFViewer({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    (async () => {
      const arrayBuffer = await file.arrayBuffer();
      const parser = XCFParser.parseBuffer(arrayBuffer);
      const image = new XCFDataImage(parser.width, parser.height);
      parser.createImage(image);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = parser.width;
        canvas.height = parser.height;
        ctx?.putImageData(image.imageData, 0, 0);
      }
    })();
  }, [file]);

  return <canvas ref={canvasRef} />;
}
```

### Q: How do I render only specific layers?

**A:** Use the `visible` property when creating the image:
```typescript
// Hide all layers first
parser.layers.forEach(layer => layer.visible = false);

// Show only specific layers
parser.getLayerByName('Background').visible = true;
parser.getLayerByName('Foreground').visible = true;

// Or use the web component:
<gpp-xcfimage src="image.xcf" visible="0,2,5"></gpp-xcfimage>
```

### Q: Can I extract layer images individually?

**A:** Not directly, but you can:
1. Hide all layers except the one you want
2. Render the image
3. Repeat for each layer

This is a planned feature for future releases.

### Q: Does xcfreader support layer effects (drop shadow, glow, etc.)?

**A:** Layer effects are stored as parasites in XCF files. xcfreader parses parasites but doesn't render effects yet. This is planned for future releases.

### Q: How do I handle errors gracefully?

**A:**
```typescript
import { XCFParser, XCFParseError, UnsupportedFormatError } from '@theprogrammingiantpanda/xcfreader/node';

try {
  const parser = await XCFParser.parseFileAsync('./image.xcf');
  // ... use parser
} catch (error) {
  if (error instanceof XCFParseError) {
    console.error('Failed to parse XCF file:', error.message);
  } else if (error instanceof UnsupportedFormatError) {
    console.error('XCF format not supported:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Q: Can I convert XCF to other formats besides PNG?

**A:** In Node.js, xcfreader outputs PNG via `pngjs`. For other formats:
1. Use `XCFPNGImage` to get PNG
2. Use another library (like `sharp`) to convert PNG to JPEG, WebP, etc.

In browsers:
1. Use `XCFDataImage.toDataURL('image/jpeg')` for JPEG
2. Use `XCFDataImage.toBlob('image/webp')` for WebP

### Q: Is there a size limit for XCF files?

**A:** No hard limit, but:
- Node.js: Limited by available memory (can handle multi-GB files)
- Browser: Limited by browser memory (typically handles files up to several hundred MB)

For very large files, consider processing server-side with Node.js.

### Q: How do I report bugs or request features?

**A:**
1. Check existing issues: https://github.com/andimclean/xcfreader/issues
2. Create a new issue with:
   - XCF file version (`parser.version`)
   - GIMP version that created the file
   - Minimal reproduction steps
   - Error messages or unexpected behavior

### Q: Can I contribute to xcfreader?

**A:** Yes! See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for guidelines.

## Still Having Issues?

If your issue isn't covered here:

1. Check the [examples directory](packages/xcfreader/examples/) for working code
2. Review the [API documentation](packages/xcfreader/readme.md)
3. Search [existing issues](https://github.com/andimclean/xcfreader/issues)
4. Create a new issue with detailed information about your problem

## Related Documentation

- [Main README](README.md)
- [xcfreader API Documentation](packages/xcfreader/readme.md)
- [ui-xcfimage Web Component](packages/ui-xcfimage/README.md)
- [Contributing Guide](.github/CONTRIBUTING.md)
