# Bundle Analysis Guide

Complete guide to analyzing xcfreader bundles using esbuild's analyzer and metafiles.

## Quick Start

### Step 1: Generate Analysis Files

```bash
npm run analyze:bundles
```

This creates:
- `bundle-analysis.html` - Summary report
- `analysis-ui-xcfimage--iife-minified-.json` - ui-xcfimage metafile
- `analysis-ha-xcfimage-card--esm-.json` - ha-xcfimage-card metafile

### Step 2: Open esbuild Analyzer

Visit **[esbuild.github.io/analyze/](https://esbuild.github.io/analyze/)** in your browser.

### Step 3: Upload Metafile

1. Click the **"Choose File"** button
2. Navigate to your xcfreader project root
3. Select one of the `analysis-*.json` files
4. Click **Open**

The analyzer will immediately display your bundle visualization!

---

## Understanding the Visualization

### Main View: Sunburst Chart

When you upload a metafile, you'll see a circular **sunburst chart**:

```
        ┌─────────────────────┐
        │   Center = Bundle   │
        │                     │
    ┌───┴───┐             ┌───┴───┐
    │ Pkg 1 │             │ Pkg 2 │
    └───┬───┘             └───┬───┘
        │                     │
    ┌───┴───┐             ┌───┴───┐
    │ File  │             │ File  │
    └───────┘             └───────┘
```

**How to read it:**
- **Center** = Your entire bundle
- **Inner rings** = Top-level packages/directories
- **Outer rings** = Individual files within packages
- **Size of slice** = Proportional to file size
- **Color** = Different packages use different colors

### Interactive Features

#### 1. Hover Over Segments

Hover over any slice to see:
```
Path: packages/xcfreader/dist/xcfreader.browser.mjs
Size: 35.26 KB
% of bundle: 84.2%
```

#### 2. Click to Zoom

Click any segment to zoom in and focus on that subtree:
```
Before: [Full Bundle]
After:  [xcfreader package view] ← zoomed
```

Click the **center** to zoom back out.

#### 3. Search & Filter

Use the search box at the top:
```
Search: "lit"
Results: Highlights all Lit-related files
```

---

## Analysis Workflow

### For ui-xcfimage Bundle

**Upload:** `analysis-ui-xcfimage--iife-minified-.json`

#### What You'll See:

```
Total Bundle: 41.83 KB

Major Segments:
├── xcfreader (local) ········· 35.26 KB (84.2%)
│   └── xcfreader.browser.mjs
└── ui-xcfimage (local) ······· 6.57 KB (15.8%)
    └── gpp-xcfimage.ts
```

#### What to Look For:

✅ **Good Signs:**
- xcfreader dominates (it's the parser - this is expected)
- No unexpected node_modules entries
- No duplicate packages

❌ **Red Flags:**
- Unexpected large dependencies
- Same package appearing multiple times
- Test files or dev dependencies included

#### Action Items:

1. **Click on xcfreader segment** to see internal file breakdown
2. **Verify** no dev/test files leaked into bundle
3. **Check** if any xcfreader modules could be lazy-loaded

---

### For ha-xcfimage-card Bundle

**Upload:** `analysis-ha-xcfimage-card--esm-.json`

#### What You'll See:

```
Total Bundle: 82.39 KB

Major Segments:
├── ha-xcfimage-card (local) ······ 40.77 KB (49.5%)
│   ├── ha-xcfimage-card.ts ······· 19.68 KB
│   └── ha-xcfimage-card-editor.ts · 21.09 KB
├── ui-xcfimage (local) ············ 58.04 KB (70.4%)
│   └── gpp-xcfimage.js
└── lit (node_modules) ············· 11.70 KB (14.2%)
    ├── lit-html/lit-html.js ······· 7.14 KB
    ├── @lit/reactive-element ······ 6.16 KB
    └── lit-element ················ 1.10 KB
```

#### What to Look For:

✅ **Good Signs:**
- Lit framework is relatively small (14.2%)
- Editor is code-split (separate file)
- ui-xcfimage properly bundled

⚠️ **Warnings:**
- Multiple `@lit/reactive-element` files (12 total)
  - This might indicate suboptimal bundling
  - Could potentially be deduplicated

❌ **Red Flags:**
- Entire Lit framework if only using small parts
- Multiple versions of same dependency
- Large unused modules

#### Action Items:

1. **Click on `@lit/reactive-element`** to see all 12 files
2. **Investigate** if they can be consolidated
3. **Consider** if code splitting is optimal (editor chunk)

---

## Interpreting Results

### Size Analysis

#### What's a Good Size?

For web components:

| Bundle Type | Target | Max Acceptable |
|-------------|--------|----------------|
| Minimal component | < 20 KB | 40 KB |
| Feature-rich component | < 50 KB | 100 KB |
| Full framework integration | < 100 KB | 200 KB |

**Current Status:**
- ✅ ui-xcfimage: 41.83 KB (under 50 KB for feature-rich)
- ✅ ha-xcfimage-card: 82.39 KB (under 100 KB for framework)

#### Size Breakdown Best Practices

```
Good Distribution:
├── Your code ······· 30-50%
├── Core library ···· 40-60%
└── Framework ······· 10-20%

Bad Distribution:
├── Your code ······· 5%
├── Dependencies ···· 95% ← Too much overhead!
```

**xcfreader Status:**
```
ui-xcfimage:
├── Component code · 15.8% ← Lightweight wrapper ✓
└── xcfreader ······ 84.2% ← Core parser ✓

ha-xcfimage-card:
├── Card code ······ 49.5% ← Feature-rich ✓
├── ui-xcfimage ···· 70.4% ← Reusing component ✓
└── Lit framework ·· 14.2% ← Efficient framework ✓
```

### Tree-Shaking Verification

#### How to Check if Tree-Shaking Works:

1. **Find a large dependency** (e.g., Lit framework)

2. **Check its size:**
   ```
   Full Lit package: ~50 KB (all features)
   In your bundle: 11.70 KB (only used features)
   Reduction: 76.6% ← Tree-shaking working! ✓
   ```

3. **Look for unused code:**
   - Search for known unused modules
   - If they appear → tree-shaking failed
   - If they don't appear → tree-shaking working

#### Example: Checking Lit

```
Expected if tree-shaking works:
├── lit-html/lit-html.js ✓
├── @lit/reactive-element ✓
└── lit-element ✓

Should NOT see (if unused):
├── lit-html/directives/* ← Not in bundle ✓
├── @lit/localize ← Not in bundle ✓
└── @lit/context ← Not in bundle ✓
```

### Duplicate Detection

#### How to Find Duplicates:

1. **Search for package name** (e.g., "reactive-element")

2. **Count highlighted segments:**
   ```
   @lit/reactive-element appears in:
   - decorators/property.js
   - decorators/query.js
   - decorators/state.js
   - css-tag.js
   - reactive-element.js
   ... (12 files total)
   ```

3. **Check if legitimate:**
   - Multiple files from same package = OK ✓
   - Same file from different versions = BAD ✗

4. **Investigate size:**
   ```
   Total @lit/reactive-element: 11.70 KB

   If 12 files are small utilities → OK
   If duplicates of same code → Problem
   ```

#### Finding Version Conflicts:

Look for patterns like:
```
node_modules/@lit/reactive-element@1.6.0
node_modules/@lit/reactive-element@1.5.2  ← Duplicate version!
```

**Current Status:** No duplicate versions detected ✓

---

## Advanced Analysis

### Comparing Before/After Changes

#### Workflow:

1. **Before changes:**
   ```bash
   npm run analyze:bundles
   cp analysis-ui-xcfimage--iife-minified-.json before.json
   ```

2. **Make your changes** (optimize imports, remove dependencies, etc.)

3. **After changes:**
   ```bash
   npm run analyze:bundles
   ```

4. **Compare in analyzer:**
   - Upload `before.json` → note sizes
   - Upload `analysis-ui-xcfimage--iife-minified-.json` → compare
   - Calculate improvement percentage

#### Example Comparison:

```
Before optimization:
ui-xcfimage: 48.2 KB
├── xcfreader: 38.1 KB
└── component: 10.1 KB

After optimization:
ui-xcfimage: 41.8 KB (-13.3%!)
├── xcfreader: 35.3 KB (-7.3%)
└── component: 6.5 KB (-35.6%)

Improvements:
✓ Removed unused imports
✓ Optimized component code
✓ Tree-shaking more effective
```

### Finding Optimization Opportunities

#### 1. Large Unexpected Files

**Look for:**
```
⚠️ some-utility-library.js: 150 KB
```

**Actions:**
- Can you use a lighter alternative?
- Can you import only what you need?
- Can you lazy-load this module?

#### 2. Deeply Nested Dependencies

**Look for:**
```
your-code
└── dependency-a
    └── dependency-b
        └── dependency-c (50 KB) ← Deep chain
```

**Actions:**
- Can you flatten the dependency tree?
- Is there a direct alternative to dependency-a?

#### 3. Test/Dev Code in Production

**Look for:**
```
❌ src/tests/
❌ node_modules/mocha/
❌ .spec.ts files
```

**Actions:**
- Fix your build configuration
- Add to `external` in esbuild config
- Use `NODE_ENV=production`

#### 4. Polyfills for Modern Browsers

**Look for:**
```
⚠️ core-js polyfills
⚠️ regenerator-runtime
```

**Actions:**
- Check your `target` in esbuild config
- If targeting modern browsers (ES2022), remove polyfills
- Use `@babel/preset-env` with correct browserslist

---

## Practical Examples

### Example 1: Investigating @lit/reactive-element

**Question:** Why are there 12 files from `@lit/reactive-element`?

**Steps:**

1. **Upload metafile** to analyzer

2. **Search:** `reactive-element`

3. **Click on highlighted segments** to see file names:
   ```
   @lit/reactive-element/
   ├── reactive-element.js ··· 6.16 KB (main module)
   ├── decorators/property.js · 1.03 KB (decorator)
   ├── decorators/query.js ···· 539 B (decorator)
   ├── decorators/state.js ···· 421 B (decorator)
   ├── css-tag.js ············· 1.55 KB (styling)
   └── ... (7 more small files)
   ```

4. **Analysis:**
   - ✓ Main module + decorators (expected for Lit components)
   - ✓ All files are small utilities
   - ✓ Total size reasonable (11.70 KB)
   - ✓ NOT duplicate versions, just multiple modules

5. **Conclusion:** This is normal Lit architecture, not a problem!

---

### Example 2: Why is xcfreader so large?

**Question:** Can we reduce the 35 KB xcfreader bundle?

**Steps:**

1. **Upload ui-xcfimage metafile**

2. **Click on xcfreader segment** to expand

3. **Look at internal modules:**
   ```
   xcfreader.browser.mjs (35.26 KB total)
   ├── gimpparser.ts ········· ~15 KB (parser logic)
   ├── lib/binary-reader.ts ·· ~3 KB (binary parsing)
   ├── lib/xcfcompositer.ts ·· ~8 KB (blend modes)
   ├── lib/xcfdataimage.ts ··· ~4 KB (canvas output)
   └── lib/xcf-parsers.ts ···· ~5 KB (format parsers)
   ```

4. **Identify optimization opportunities:**
   - ⚠️ Blend modes (8 KB) - Could some be lazy-loaded?
   - ✓ Binary reader (3 KB) - Already optimized
   - ✓ Parser logic (15 KB) - Core functionality, can't reduce

5. **Potential optimization:**
   ```typescript
   // Instead of bundling all blend modes:
   import { NormalCompositer, MultiplyCompositer } from './compositer';

   // Lazy-load rare modes:
   const DissolveCompositer = await import('./dissolve-compositer');
   ```

6. **Estimated savings:** 3-5 KB (by lazy-loading rarely-used blend modes)

---

### Example 3: Tracking Size Over Time

**Setup:**

1. **Create baseline script** (`scripts/track-bundle-size.sh`):
   ```bash
   #!/bin/bash
   npm run analyze:bundles

   UI_SIZE=$(node -p "JSON.parse(require('fs').readFileSync('analysis-ui-xcfimage--iife-minified-.json')).outputs['gpp-xcfimage.js'].bytes")
   HA_SIZE=$(node -p "JSON.parse(require('fs').readFileSync('analysis-ha-xcfimage-card--esm-.json')).outputs['ha-xcfimage-card.js'].bytes")

   echo "$(date +%Y-%m-%d),$UI_SIZE,$HA_SIZE" >> bundle-size-history.csv
   ```

2. **Run weekly:**
   ```bash
   npm run build
   ./scripts/track-bundle-size.sh
   ```

3. **Track trends:**
   ```csv
   Date,UI Bundle,HA Bundle
   2026-02-13,42830,82390
   2026-02-20,41200,80100  ← 3% reduction
   2026-02-27,43500,85200  ← 5% increase (investigate!)
   ```

---

## Troubleshooting

### Problem: Can't Upload Metafile

**Error:** "Invalid metafile format"

**Solution:**
1. Make sure you're uploading the `analysis-*.json` file, not `bundle-analysis.html`
2. Check the JSON is valid:
   ```bash
   node -p "JSON.parse(require('fs').readFileSync('analysis-ui-xcfimage--iife-minified-.json'))"
   ```

### Problem: Visualization is Confusing

**Issue:** Too many tiny segments

**Solution:**
1. Click on a large segment to zoom in
2. Use search to filter by package name
3. Focus on segments > 1% of bundle

### Problem: Size Doesn't Match

**Issue:** Analyzer shows different size than `npm run bundle-size`

**Why:**
- Analyzer shows **uncompressed** size
- `bundle-size` shows **gzipped** size
- Both are correct, just different measurements

**Example:**
```
Analyzer:  42.83 KB (raw)
Gzipped:   12.50 KB (compressed)
Ratio:     3.4x compression
```

---

## Best Practices

### Regular Analysis Schedule

```bash
# Weekly: Check bundle health
npm run analyze:bundles

# Before releases: Verify no bloat
npm run build
npm run bundle-size:ci
npm run analyze:bundles

# After adding dependencies: Assess impact
npm install some-library
npm run build
npm run analyze:bundles  # Compare to baseline
```

### Size Budget Enforcement

Create a size budget file (`.bundlesizerc`):

```json
{
  "files": [
    {
      "path": "packages/ui-xcfimage/dist/gpp-xcfimage.iife.min.js",
      "maxSize": "45 KB"
    },
    {
      "path": "packages/ha-xcfimage-card/dist/ha-xcfimage-card.js",
      "maxSize": "90 KB"
    }
  ]
}
```

Add to CI:
```yaml
- name: Check bundle size budget
  run: npm run bundle-size:ci
```

### Documentation

Document major bundle components in README:

```markdown
## Bundle Size

- ui-xcfimage: 42 KB (12 KB gzipped)
  - xcfreader parser: 35 KB (84%)
  - Component code: 7 KB (16%)

- ha-xcfimage-card: 82 KB (20 KB gzipped)
  - Card implementation: 41 KB (50%)
  - ui-xcfimage: 29 KB (35%)
  - Lit framework: 12 KB (15%)
```

---

## Quick Reference

### Commands

```bash
# Generate analysis
npm run analyze:bundles

# Check size limits
npm run bundle-size

# Update baseline
npm run bundle-size:baseline

# CI check (fails if over limit)
npm run bundle-size:ci
```

### Files Generated

| File | Purpose | Upload to Analyzer? |
|------|---------|---------------------|
| `bundle-analysis.html` | Quick summary | No |
| `analysis-ui-xcfimage--iife-minified-.json` | ui-xcfimage metafile | **Yes** |
| `analysis-ha-xcfimage-card--esm-.json` | ha-xcfimage-card metafile | **Yes** |

### Size Targets

| Bundle | Current | Target | Max |
|--------|---------|--------|-----|
| ui-xcfimage (min) | 41.83 KB | < 40 KB | 50 KB |
| ui-xcfimage (gzip) | 12.50 KB | < 12 KB | 15 KB |
| ha-xcfimage-card (min) | 82.39 KB | < 80 KB | 100 KB |
| ha-xcfimage-card (gzip) | 20.00 KB | < 18 KB | 25 KB |

### Quick Checks

✅ **Healthy Bundle:**
- No unexpected large dependencies
- No duplicate packages (different versions)
- No test/dev files
- Tree-shaking reducing library sizes by 50%+

⚠️ **Needs Investigation:**
- Single dependency > 40% of bundle
- Multiple versions of same package
- Bundle grew >10% without new features
- Compression ratio < 3x

❌ **Serious Issues:**
- Test files in production bundle
- Entire frameworks when using small parts
- Multiple duplicate large dependencies
- Bundle over size budget

---

## Further Reading

- [esbuild Bundle Analysis](https://esbuild.github.io/api/#analyze)
- [esbuild Metafile Format](https://esbuild.github.io/api/#metafile)
- [Web Performance: Bundle Size](https://web.dev/performance-budgets-101/)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) (alternative tool)
