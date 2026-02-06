# Web Workers for Large XCF File Parsing

## Executive Summary

This document analyzes the feasibility and implementation approach for using Web Workers to parse large XCF files in the browser without blocking the UI thread.

**Recommendation**: Web Workers are feasible and would provide significant UX benefits for large files (>10MB), but require careful architecture due to the synchronous nature of the current parsing code.

## Current Performance Characteristics

### Measured Performance (from benchmarks)

Based on `packages/xcfreader/lastbenchmark-2026-02-03.txt`:

| File | Size | Parse Time | Status |
|------|------|------------|--------|
| single.xcf | 44KB | ~1.5ms | ✅ No blocking |
| multi.xcf | 91KB | ~2.8ms | ✅ No blocking |
| text.xcf | 115KB | ~3.1ms | ✅ No blocking |
| grey.xcf | 1020KB | ~20ms | ✅ Acceptable |
| map1.xcf | 7.4MB | ~289ms | ⚠️ Slight blocking |
| fullColour.xcf | 6.5MB | ~402ms | ⚠️ Noticeable blocking |

### UI Blocking Threshold

- **<16ms**: No perceptible blocking (60 FPS maintained)
- **16-100ms**: Slight jank, usually acceptable
- **100-1000ms**: Noticeable UI freeze, poor UX
- **>1000ms**: Severe blocking, unacceptable UX

**Conclusion**: Files >1MB benefit from Web Worker offloading.

## Benefits of Web Workers

### 1. Non-Blocking UI
- Keeps browser responsive during parsing
- Users can interact with other page elements
- Progress indicators remain smooth

### 2. Better UX for Large Files
- Parse 6MB files without freezing
- Multiple files can be queued
- Cancel operations mid-parse

### 3. Parallel Processing Potential
- Parse multiple files simultaneously
- Utilize multi-core CPUs
- Process layers in parallel

## Implementation Challenges

### 1. Synchronous Parsing Architecture

**Current Code**:
```typescript
const parser = XCFParser.parseBuffer(arrayBuffer);
const image = new XCFDataImage(parser.width, parser.height);
parser.createImage(image);
```

**Challenge**: Parser is entirely synchronous with no async hooks.

**Solution Options**:
- **Option A**: Create async wrapper that communicates via postMessage
- **Option B**: Refactor parser to be async (breaking change)
- **Option C**: Keep synchronous but run entire operation in worker

**Recommendation**: Option C (least breaking, easiest to implement)

### 2. Data Transfer Overhead

**Challenge**: Transferring large ImageData between worker and main thread.

**Solution**: Use Transferable Objects
```typescript
// In worker
const imageData = image.imageData;
postMessage({ imageData }, [imageData.data.buffer]);
```

**Benefit**: Zero-copy transfer (ownership moves instead of copying)

### 3. Module Loading in Workers

**Challenge**: Workers need separate bundle or ES modules.

**Current Setup**: esbuild already creates browser bundle.

**Solution**:
- Use `type: "module"` worker (supported in modern browsers)
- Or create separate worker bundle with esbuild

## Proposed Architecture

### High-Level Design

```
Main Thread                    Web Worker Thread
-----------                    -----------------
User uploads file
  └─> Send ArrayBuffer ───────> Parse XCF
      (transferable)             └─> Create image data
                                     └─> Composite layers
  <─── Return ImageData ─────── Send result
       (transferable)            (transferable)

Draw to canvas <───┘
```

### Implementation Approach

#### 1. Worker Implementation

Create `packages/ui-xcfimage/src/xcf-worker.ts`:

```typescript
import { XCFParser, XCFDataImage } from '@theprogrammingiantpanda/xcfreader/browser';

// Listen for parse requests
self.addEventListener('message', async (event) => {
  const { type, data, taskId } = event.data;

  try {
    if (type === 'parse') {
      // Report progress
      self.postMessage({ type: 'progress', taskId, progress: 0 });

      // Parse XCF (synchronous)
      const parser = XCFParser.parseBuffer(data);

      self.postMessage({ type: 'progress', taskId, progress: 30 });

      // Create image
      const image = new XCFDataImage(parser.width, parser.height);
      parser.createImage(image);

      self.postMessage({ type: 'progress', taskId, progress: 90 });

      // Send result with transferable
      const imageData = image.imageData;
      self.postMessage(
        {
          type: 'complete',
          taskId,
          imageData,
          width: parser.width,
          height: parser.height
        },
        [imageData.data.buffer]
      );
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      taskId,
      error: error.message
    });
  }
});
```

#### 2. Main Thread Integration

Update `gpp-xcfimage.ts`:

```typescript
export class GPpXCFImage extends HTMLElement {
  private worker: Worker | null = null;
  private useWorker: boolean = true; // Configurable

  constructor() {
    super();
    // Initialize worker if supported and enabled
    if (typeof Worker !== 'undefined' && this.useWorker) {
      this.worker = new Worker(
        new URL('./xcf-worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
    }
  }

  private async loadWithWorker(arrayBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const taskId = Math.random().toString(36);

      const handler = (event: MessageEvent) => {
        const { type, taskId: responseId, ...data } = event.data;

        if (responseId !== taskId) return;

        if (type === 'progress') {
          // Update progress UI
          this.updateProgress(data.progress);
        } else if (type === 'complete') {
          this.worker?.removeEventListener('message', handler);
          this.renderImageData(data.imageData, data.width, data.height);
          resolve();
        } else if (type === 'error') {
          this.worker?.removeEventListener('message', handler);
          reject(new Error(data.error));
        }
      };

      this.worker?.addEventListener('message', handler);

      // Send parse request (transfer ownership)
      this.worker?.postMessage(
        { type: 'parse', taskId, data: arrayBuffer },
        [arrayBuffer]
      );
    });
  }

  private async loadAndRender(): Promise<void> {
    if (!this.src || this.isLoaded) return;

    try {
      const arrayBuffer = await this.fetchWithRetry(this.src);

      // Use worker for large files, direct parsing for small files
      const useWorker = this.worker && arrayBuffer.byteLength > 1024 * 1024; // >1MB

      if (useWorker) {
        await this.loadWithWorker(arrayBuffer);
      } else {
        // Fallback to synchronous parsing
        this.parser = XCFParser.parseBuffer(arrayBuffer);
        this.renderImage();
      }

      this.isLoaded = true;
    } catch (err) {
      this.showError("Failed to load XCF: " + err.message);
    }
  }
}
```

#### 3. Progressive Enhancement

```typescript
// Feature detection
static get observedAttributes() {
  return [..., 'use-worker'];
}

connectedCallback() {
  // Check for worker support
  const supportsWorker = typeof Worker !== 'undefined';
  const useWorker = this.hasAttribute('use-worker');

  if (useWorker && !supportsWorker) {
    console.warn('Web Workers not supported, falling back to main thread');
  }
}
```

### Usage

```html
<!-- Enable Web Worker (default for large files) -->
<gpp-xcfimage src="large-file.xcf" use-worker></gpp-xcfimage>

<!-- Force main thread parsing -->
<gpp-xcfimage src="small-file.xcf"></gpp-xcfimage>
```

## Performance Gains

### Expected Improvements

| File Size | Current | With Worker | Improvement |
|-----------|---------|-------------|-------------|
| 44KB | No blocking | No blocking | None needed |
| 1MB | 20ms block | 0ms block | UI responsive |
| 6.5MB | 400ms block | 0ms block | **No freeze** |
| 20MB | ~2s block | 0ms block | **Huge UX win** |

### Trade-offs

**Pros**:
- ✅ Non-blocking UI for large files
- ✅ Better UX and perceived performance
- ✅ Cancellable operations
- ✅ Progress reporting
- ✅ Parallel processing potential

**Cons**:
- ❌ Added complexity (worker lifecycle, messaging)
- ❌ Slight overhead for small files (<1MB)
- ❌ Bundle size increase (~2KB for worker code)
- ❌ Debugging is harder
- ❌ Browser compatibility (though very good)

## Browser Compatibility

Web Workers are well-supported:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Web Workers | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Transferable Objects | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Module Workers | ✅ 80+ | ✅ 114+ | ✅ 15+ | ✅ 80+ |

**Recommendation**: Use with progressive enhancement fallback.

## Implementation Roadmap

### Phase 1: Basic Worker Support (2-3 days)
1. Create xcf-worker.ts with basic parsing
2. Add worker initialization to gpp-xcfimage
3. Implement message passing protocol
4. Add fallback to main thread

### Phase 2: Enhanced Features (2-3 days)
5. Progress reporting
6. Cancellation support
7. Error handling improvements
8. Size-based auto-detection

### Phase 3: Optimization (1-2 days)
9. Transferable object optimization
10. Worker pooling for multiple files
11. Performance testing and benchmarks

### Phase 4: Testing & Documentation (1-2 days)
12. Unit tests for worker communication
13. Browser compatibility testing
14. Documentation and examples
15. Demo page updates

**Total Estimated Effort**: 6-10 days

## Alternative Approaches

### 1. Async/Await Refactoring
**Approach**: Make parser fully async with yield points.
```typescript
async parseAsync(buffer: ArrayBuffer): Promise<XCFParser> {
  // Parse header
  await this.parseHeader(buffer);

  // Parse layers with yield points
  for (const layerPtr of layerPointers) {
    await this.parseLayer(layerPtr);
    await this.yieldToMainThread(); // Periodic yield
  }
}
```

**Pros**: Works on main thread, no worker complexity
**Cons**: Major refactoring, breaks API, still some blocking

### 2. Lazy Parsing
**Approach**: Parse only visible layers on-demand.
```typescript
class LazyXCFParser {
  async getLayer(index: number): Promise<GimpLayer> {
    if (!this.layersCache[index]) {
      this.layersCache[index] = await this.parseLayer(index);
    }
    return this.layersCache[index];
  }
}
```

**Pros**: Faster initial load, less memory
**Cons**: Delayed rendering, complex caching

### 3. WebAssembly (WASM)
**Approach**: Compile parser to WASM for speed.

**Pros**: 2-5x faster parsing
**Cons**: Large effort, bundle size, still blocks without worker

## Recommendation

**Priority**: **Medium-High**

### Immediate Action
1. Implement basic Web Worker support for files >1MB
2. Keep fallback to synchronous parsing
3. Add `use-worker` attribute for opt-in

### Future Enhancements
- Worker pooling for multiple files
- Layer-level parallelization
- WASM optimization (separate effort)

### When to Skip
- If target users primarily use small files (<1MB)
- If dev resources are extremely limited
- If bundle size is critical concern

## Example Proof of Concept

See `examples/web-worker-demo.html` for working example.

## Conclusion

Web Workers provide significant UX improvements for large XCF files with acceptable complexity trade-offs. The progressive enhancement approach ensures compatibility while providing better experience for modern browsers.

**Estimated Impact**:
- **Small files (<1MB)**: No change
- **Medium files (1-10MB)**: Eliminates UI blocking
- **Large files (>10MB)**: Transforms from unusable to smooth

**Complexity**: Moderate (worker communication, fallback handling)
**Priority**: Implement for v2.0 release
**ROI**: High for applications handling large files

---

**Document Version**: 1.0
**Last Updated**: 2026-02-05
**Author**: Claude Sonnet 4.5
