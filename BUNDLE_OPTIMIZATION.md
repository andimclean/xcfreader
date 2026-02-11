# Bundle Size Optimization Guide

## Current Bundle Sizes (Minified)

| Package                        | Size      | Gzipped (est.) |
| ------------------------------ | --------- | -------------- |
| xcfreader (browser)            | 78KB      | ~25-30KB       |
| ui-xcfimage                    | 85KB      | ~28-32KB       |
| ha-xcfimage-card (initial)     | 94KB      | ~32KB          |
| ha-xcfimage-card (editor lazy) | +31KB     | +10KB          |
| **ha-xcfimage-card total**     | **125KB** | **~42KB**      |

## Recent Improvements ✅

### 1. Replaced binary-parser with Custom BinaryReader

- **Impact**: Reduced xcfreader bundle size significantly
- **Commit**: `perf(xcfreader): replace binary-parser with custom BinaryReader`

### 2. Enabled Minification for HA Card

- **Before**: 186KB (unminified)
- **After**: 125KB (minified)
- **Savings**: 61KB (33% reduction)

### 3. Tree-Shaking & Dead Code Elimination

- Enabled in esbuild configs
- Drops `debugger` statements
- Marks `console.log`/`console.debug` as pure (removable)

### 4. ES2022 Target (Modern Browsers)

- Updated from ES2020 to ES2022
- Better native browser optimizations
- Removes polyfills for modern features
- **Browser support**: Chrome 94+, Firefox 101+, Safari 15.4+

### 5. Code Splitting for Editor (25% initial load reduction)

- **Before**: 125KB loaded upfront
- **After**: 94KB initial + 31KB lazy (editor)
- **Savings**: 31KB on initial page load (25% reduction)
- Editor only loads when user enters edit mode
- Uses dynamic imports with ESM format

## Further Optimization Strategies

### High Impact 🔥

#### A. Enable HTTP Compression (60-70% reduction)

Ensure your web server compresses JavaScript files:

**Nginx:**

```nginx
gzip on;
gzip_types text/javascript application/javascript;
gzip_min_length 1000;
gzip_comp_level 6;

# Or use Brotli for better compression
brotli on;
brotli_types text/javascript application/javascript;
```

**Apache:**

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE application/javascript
</IfModule>
```

**Expected compressed sizes:**

- xcfreader: 78KB → **25-30KB**
- ui-xcfimage: 85KB → **28-32KB**
- ha-xcfimage-card: 125KB → **40-45KB**

#### B. ✅ Code Splitting for Editor - **IMPLEMENTED**

**Result**: 31KB reduction on initial load (25% reduction)

The editor is now lazy-loaded only when needed:

- Initial card view: 94KB
- Editor (on-demand): +31KB
- Uses dynamic imports with esbuild code splitting

### Medium Impact 💡

#### C. ✅ Target Modern Browsers - **IMPLEMENTED**

**Result**: Better runtime performance, cleaner output

All bundles now target ES2022:

- Native browser features (no polyfills)
- Better JIT optimization
- **Trade-off**: Requires Chrome 94+, Firefox 101+, Safari 15.4+

#### D. Analyze & Tree-Shake Lit

Currently Lit components add ~20KB to ha-xcfimage-card. Consider:

- Using only needed Lit decorators
- Custom lightweight state management if Lit is overkill

#### E. Remove Source Maps in Production

Currently sourcemaps are enabled. For production builds:

```javascript
sourcemap: false; // Saves ~20-30% file size
```

**Note**: Keep sourcemaps for debugging, disable only for final distribution.

### Low Impact 🔧

#### F. Property Mangling (2-5% reduction)

Mangle private properties (RISKY - can break code):

```javascript
// esbuild.config.mjs
mangleProps: /^_/; // Mangle properties starting with _
```

**Warning**: Only do this if you're sure no external code accesses these properties.

#### G. Drop Console Statements (1-2% reduction)

Already configured to drop `console.log` and `console.debug`.
Keep `console.error` for error reporting.

## Bundle Composition Analysis

Run `node analyze-bundles.mjs` to see what's in your bundles:

```bash
npm run build
node analyze-bundles.mjs
```

**Current breakdown (ha-xcfimage-card 124KB):**

- ui-xcfimage bundle: 116KB (93%)
  - xcfreader: ~78KB
  - web component code: ~38KB
- Lit framework: ~8KB (7%)

## Recommendations Priority

1. ✅ **DONE**: Enable minification (-61KB, 33% reduction)
2. ✅ **DONE**: Lazy load editor component (-31KB initial, 25% reduction)
3. ✅ **DONE**: Target ES2022 (modern browsers, better performance)
4. 🔥 **HIGH**: Enable gzip/brotli compression on server (60-70% reduction)
5. 💡 **MEDIUM**: Disable sourcemaps for production builds (20-30% smaller)
6. 🔧 **LOW**: Property mangling (risky, 2-5%)

## Measuring Bundle Size

Check current sizes:

```bash
npm run build
ls -lh packages/*/dist/*.min.js packages/ha-xcfimage-card/dist/*.js
```

Analyze composition:

```bash
node analyze-bundles.mjs
```

## Target Sizes

**Conservative (with compression):**

- xcfreader: ~30KB gzipped ✅ (already optimal)
- ui-xcfimage: ~32KB gzipped ✅ (already optimal)
- ha-xcfimage-card: ~45KB gzipped ✅ (already optimal)

**Aggressive (with all optimizations):**

- ha-xcfimage-card: ~35KB gzipped (with code splitting + es2022)

## Notes

- The custom BinaryReader in xcfreader is already very lean (78KB)
- Most savings will come from server-side compression (HTTP level)
- Code splitting has the highest development ROI for ha-xcfimage-card
- Don't over-optimize at the cost of maintainability
