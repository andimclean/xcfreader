# Quick Start Guide

Get your XCF Image Card running in Home Assistant in 5 minutes!

## Prerequisites

- Home Assistant installed and running
- A GIMP XCF file with multiple layers
- Basic knowledge of Home Assistant entity IDs

## Step 1: Prepare Your XCF File (2 min)

1. Open GIMP and create or open an image
2. Create separate layers for each element you want to control:
   ```
   Example for a floor plan:
   - Layer 0: Kitchen light indicator (circle/glow)
   - Layer 1: Living room light indicator
   - Layer 2: Bedroom light indicator
   - Layer 3: Background floor plan
   ```
3. Save as `.xcf` file
4. Note: Layers are indexed from bottom (0) to top (N-1)

## Step 2: Copy File to Home Assistant (1 min)

```bash
# Copy your XCF file to Home Assistant's www folder
cp myfloorplan.xcf /config/www/

# Or use the File Editor add-on to upload it
```

The file will be accessible at `/local/myfloorplan.xcf`

## Step 3: Install the Card (1 min)

### Quick Manual Install

1. Download `ha-xcfimage-card.js` from this repository's `dist/` folder
2. Copy to `/config/www/ha-xcfimage-card.js`
3. Add resource in Home Assistant:
   - Settings → Dashboards → Resources
   - Click "+ Add Resource"
   - URL: `/local/ha-xcfimage-card.js`
   - Resource type: JavaScript Module
4. Restart Home Assistant

## Step 4: Add Card to Dashboard (1 min)

1. Edit your dashboard
2. Click "+ Add Card"
3. Scroll down or search for "XCF Image Card"
4. Click on it, then "Show Code Editor"
5. Paste this configuration (modify for your setup):

```yaml
type: custom:ha-xcfimage-card
title: My Floor Plan
xcf_url: /local/myfloorplan.xcf
entity_layers:
  - entity: light.kitchen
    layer: 0
  - entity: light.living_room
    layer: 1
  - entity: light.bedroom
    layer: 2
default_visible: [3]  # Background layer always visible
```

6. Save!

## Common Patterns

### Pattern 1: Light Control
```yaml
type: custom:ha-xcfimage-card
xcf_url: /local/lights.xcf
entity_layers:
  - entity: light.living_room
    layer: 0
  - entity: light.kitchen
    layer: 1
```

### Pattern 2: Door/Window Sensors
```yaml
type: custom:ha-xcfimage-card
xcf_url: /local/security.xcf
entity_layers:
  - entity: binary_sensor.front_door
    layer: 0
    state_on: "on"  # "on" = door open
  - entity: binary_sensor.window
    layer: 1
    state_on: "on"
default_visible: [2]  # House outline
```

### Pattern 3: Multi-State (Weather)
```yaml
type: custom:ha-xcfimage-card
xcf_url: /local/weather.xcf
entity_layers:
  - entity: weather.home
    layer: 0
    state_on: "sunny"
  - entity: weather.home
    layer: 1
    state_on: "cloudy"
  - entity: weather.home
    layer: 2
    state_on: "rainy"
```

## Tips

- **Layer indices start at 0** from the bottom layer
- Use descriptive layer names in GIMP to track them easily
- Keep XCF files under 5MB for best performance
- Use `default_visible` for background layers that should always show
- Test with the demo.html file before deploying to Home Assistant

## Testing Locally

Before adding to Home Assistant, test your card:

```bash
cd packages/ha-xcfimage-card
npm run build
npx serve ../.. -l 3000
# Open http://localhost:3000/packages/ha-xcfimage-card/demo.html
```

## Need Help?

- **Card doesn't show**: Clear browser cache (Ctrl+Shift+F5)
- **XCF not loading**: Check URL is `/local/filename.xcf` not `/www/`
- **Wrong layers**: Remember layers are indexed from bottom (0) to top
- **No updates**: Verify entity IDs exist in Home Assistant

## Next Steps

- Read the full [README.md](./README.md) for advanced features
- Check [INSTALL.md](./INSTALL.md) for detailed installation options
- See [example-config.yaml](./example-config.yaml) for more examples
