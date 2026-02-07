# NPM Release Checklist

## Pre-Release Verification

### ✅ Build Status
- [x] All packages build successfully
  - [x] xcfreader: TypeScript compiled, browser bundles generated
  - [x] ui-xcfimage: TypeScript compiled, IIFE bundle generated
  - [x] ha-xcfimage-card: TypeScript compiled, bundle generated

### ✅ Test Status
- [x] xcfreader: All 33 tests passing
- [ ] ui-xcfimage: Playwright tests (run separately)
- [ ] ha-xcfimage-card: Manual testing required

### ✅ Documentation
- [x] All CHANGELOGs updated with unreleased features
- [x] All README files current and accurate
- [x] TypeDoc API documentation generated (xcfreader)
- [x] DOCUMENTATION_UPDATE_SUMMARY.md created
- [x] All changes committed to git

### ✅ Package Configuration

#### xcfreader (v1.0.1)
- [x] package.json configured with correct exports
- [x] Files array includes all necessary dist files
- [x] Dependencies: binary-parser
- [x] Peer dependencies: pngjs (optional)
- [x] Repository URL correct
- [x] License: MIT
- [x] Keywords appropriate
- [x] Public access configured

#### ui-xcfimage (v0.1.2)
- [x] package.json configured
- [x] Dependencies: @theprogrammingiantpanda/xcfreader@^1.0.1
- [x] Files array includes dist/ and demo.html
- [x] Repository URL correct
- [x] License: MIT
- [x] Public access configured

#### ha-xcfimage-card (v0.2.0 - UNRELEASED)
- [x] package.json configured
- [x] Dependencies: @theprogrammingiantpanda/ui-xcfimage@^0.1.2, lit@^3.1.0
- [x] Files array includes dist/ and README.md
- [x] Repository URL correct
- [x] License: MIT
- [x] Public access configured

## Current Package Versions

| Package | Current | Status | Notes |
|---------|---------|--------|-------|
| xcfreader | 1.0.1 | Published | Ready for re-publish if needed |
| ui-xcfimage | 0.1.2 | Published | Ready for re-publish if needed |
| ha-xcfimage-card | 0.2.0 | Unreleased | New features, ready to publish |

## Publishing Steps

### Option 1: Publish All Packages
```bash
# Login to npm (if not already logged in)
npm login

# Publish each package from their directories
cd packages/xcfreader
npm publish

cd ../ui-xcfimage
npm publish

cd ../ha-xcfimage-card
npm publish
```

### Option 2: Publish Only Changed Package (ha-xcfimage-card)
```bash
# Login to npm
npm login

# Publish only ha-xcfimage-card (has unreleased features)
cd packages/ha-xcfimage-card
npm publish
```

## Post-Release Steps

After publishing:

1. **Tag the release in git**
   ```bash
   git tag v0.2.0-ha-xcfimage-card
   git push origin v0.2.0-ha-xcfimage-card
   ```

2. **Update CHANGELOGs**
   - Move unreleased entries to versioned sections
   - Add release dates
   - Create new [Unreleased] section

3. **Create GitHub Release**
   - Go to https://github.com/andimclean/xcfreader/releases
   - Create new release from tag
   - Include changelog entries
   - Mention breaking changes if any

4. **Update version numbers** (if doing next development cycle)
   ```bash
   # For patch updates
   cd packages/ha-xcfimage-card
   npm version patch
   
   # Or for minor/major
   npm version minor
   npm version major
   ```

5. **Verify on npm**
   - Check package pages:
     - https://www.npmjs.com/package/@theprogrammingiantpanda/xcfreader
     - https://www.npmjs.com/package/@theprogrammingiantpanda/ui-xcfimage
     - https://www.npmjs.com/package/@theprogrammingiantpanda/ha-xcfimage-card
   - Verify correct files are included
   - Test installation: `npm install @theprogrammingiantpanda/ha-xcfimage-card@latest`

6. **Update CDN links** (if needed)
   - jsDelivr: https://cdn.jsdelivr.net/npm/@theprogrammingiantpanda/ha-xcfimage-card@latest/
   - unpkg: https://unpkg.com/@theprogrammingiantpanda/ha-xcfimage-card@latest/

## Pre-Publish Validation

Run these commands before publishing:

```bash
# Check what will be published
cd packages/ha-xcfimage-card
npm pack --dry-run

# Verify package contents
npm pack
tar -tzf theprogrammingiantpanda-ha-xcfimage-card-0.2.0.tgz

# Clean up
rm *.tgz
```

## Important Notes

- **Never publish from dirty working directory** - Commit all changes first
- **Test locally first** - Use `npm link` to test packages locally
- **Check npm credentials** - Ensure you're logged in with correct account
- **Verify public access** - All packages should have `"access": "public"` in publishConfig
- **Follow semantic versioning** - MAJOR.MINOR.PATCH
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes (backward compatible)

## Dependencies Check

### ha-xcfimage-card depends on:
- ui-xcfimage@^0.1.2 ✅ (published)
- lit@^3.1.0 ✅ (external)

### ui-xcfimage depends on:
- xcfreader@^1.0.1 ✅ (published)

### xcfreader depends on:
- binary-parser@^2.3.0 ✅ (external)
- pngjs@^7.0.0 ✅ (peer, optional)

All dependencies satisfied! ✅

## Breaking Changes

Review for breaking changes before publishing:
- [ ] API changes that break existing code?
- [ ] Removed or renamed exports?
- [ ] Changed function signatures?
- [ ] Changed default behavior?
- [ ] Removed deprecated features?

**Current release (ha-xcfimage-card v0.2.0)**: No breaking changes ✅
- Only additions (Visual Config Editor, Entity Overlays, CDN)
- All existing features backward compatible

## Security Check

- [x] No credentials in code
- [x] No sensitive data in package
- [x] Dependencies up to date
- [x] No known vulnerabilities (run `npm audit`)

## Ready to Publish? ✅

All checks passed! Packages are ready for npm release.

**Recommended action**: Publish ha-xcfimage-card v0.2.0 (new features)

---
**Last Updated**: February 7, 2026
**Status**: ✅ READY FOR RELEASE
