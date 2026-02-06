# Installation Guide

## Step 1: Copy XCF File to Home Assistant

1. Create your XCF file in GIMP with layers representing different states
2. Copy the XCF file to Home Assistant's `www` folder:
   - Location: `<config>/www/`
   - Example: `/config/www/floorplan.xcf`
3. The file will be accessible at `/local/floorplan.xcf`

## Step 2: Install the Card

### Option A: CDN (Recommended)

1. Go to Settings → Dashboards → Resources in Home Assistant
2. Click "Add Resource"
3. URL: `https://cdn.jsdelivr.net/npm/@theprogrammingiantpanda/ha-xcfimage-card@latest/dist/ha-xcfimage-card.js`
4. Resource type: JavaScript Module
5. Click "Create"
6. Restart Home Assistant (or clear browser cache)

### Option B: Manual Installation

1. Download `ha-xcfimage-card.js` from the releases
2. Copy it to `<config>/www/ha-xcfimage-card.js`
3. Add the resource in Home Assistant:
   - Go to Settings → Dashboards → Resources
   - Click "Add Resource"
   - URL: `/local/ha-xcfimage-card.js`
   - Resource type: JavaScript Module
   - Click "Create"
4. Restart Home Assistant (or clear browser cache)

## Step 3: Add Card to Dashboard

1. Edit your dashboard
2. Click "Add Card"
3. Search for "XCF Image Card"
4. Configure the card (see example below)

### Example Configuration

```yaml
type: custom:ha-xcfimage-card
title: Living Room Floor Plan
xcf_url: /local/floorplan.xcf
entity_layers:
  - entity: light.living_room_main
    layer: 0
    state_on: "on"
  - entity: light.living_room_lamp
    layer: 1
    state_on: "on"
  - entity: binary_sensor.motion_living_room
    layer: 2
    state_on: "on"
default_visible: [3]
```

## Step 4: Identify Layer Indices

To find out which layer index corresponds to which layer in your XCF file:

1. Open your XCF file in GIMP
2. Open the Layers dialog (Windows → Dockable Dialogs → Layers)
3. Layers are indexed from bottom to top, starting at 0:
   ```
   Top layer    = index N-1
   ...
   Middle layer = index 1
   Bottom layer = index 0
   ```

## Troubleshooting

### Card doesn't appear

- Clear browser cache and hard reload (Ctrl+Shift+R)
- Check browser console for errors
- Verify the resource is loaded in Settings → Dashboards → Resources

### XCF file not loading

- Verify the file is in `<config>/www/` folder
- Check the URL starts with `/local/` not `/www/`
- Ensure the file is a valid XCF file
- Check Home Assistant logs for errors

### Layers not updating

- Verify entity IDs are correct and exist
- Check the `state_on` values match the actual entity states
- Open browser console to see any errors
- Verify layer indices match your XCF file structure

### Performance issues

- Use XCF files with reasonable file sizes (< 5MB recommended)
- Consider reducing layer count or image resolution
- Avoid setting `forcevisible` unless necessary (forces all layers to render)
