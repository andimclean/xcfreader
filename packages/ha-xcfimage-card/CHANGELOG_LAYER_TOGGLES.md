# Layer Toggles Update - Fix for Dynamic XCF File Changes

## Problem
When switching between different XCF files in the Home Assistant demo, the layer toggle controls were not updating to reflect the layers in the new file. The toggles remained configured for the first file's layers.

## Root Causes
1. **Missing Events**: The `gpp-xcfimage` component wasn't dispatching the `xcf-loading`, `xcf-loaded`, and `xcf-error` events that the HA card was listening for.

2. **Static Entity Configuration**: The demo.html had hardcoded entity configurations specific to multi.xcf, and these weren't regenerated when the file changed.

3. **Wrong Import Path**: The package import was using `xcfreader/browser` instead of the scoped package name `@theprogrammingiantpanda/xcfreader/browser`.

## Changes Made

### 1. gpp-xcfimage.ts (packages/ui-xcfimage/src/)
Added custom event dispatching in the `loadAndRender()` method:
- Dispatches `xcf-loading` when starting to load a file
- Dispatches `xcf-loaded` with layer data when loading succeeds
- Dispatches `xcf-error` with error details when loading fails
- All events use `bubbles: true` and `composed: true` to propagate through shadow DOM

Fixed import path to use scoped package name.

### 2. demo.html (packages/ha-xcfimage-card/)
Enhanced the demo to dynamically regenerate entity controls:
- Changed `entities` from `const` to `let` to allow updates
- Added `generateEntitiesFromLayers()` function to parse layer tree
- Added `createEntityControls()` function to generate toggle UI
- Added event listener for `xcf-loaded` that:
  - Extracts layer information from the event
  - Regenerates entity list based on actual layers
  - Resets mockHass states for new entities
  - Recreates the control UI
  - Updates the card configuration

## Result
Now when you change the XCF file in the dropdown:
1. The new file loads and dispatches an `xcf-loaded` event
2. The demo extracts layer information from the event
3. Entity controls are regenerated to match the layers in the new file
4. Each layer gets its own toggle with the correct layer name and index
5. Toggling works correctly for all layers in any loaded file

## Testing
To test the fix:
1. Serve the demo: `npm run serve` (from packages/ha-xcfimage-card or from repo root)
2. Open http://localhost:3000/packages/ha-xcfimage-card/demo.html
3. Select different XCF files from the dropdown
4. Observe that the entity controls update to show layers from the selected file
5. Toggle layers on/off to verify they work correctly
