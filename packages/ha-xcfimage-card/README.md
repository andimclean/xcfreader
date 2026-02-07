# Home Assistant XCF Image Card

A custom Home Assistant card that displays GIMP XCF files with layer visibility controlled by Home Assistant entities.

## Features

- 🎨 Display GIMP XCF files directly in Home Assistant
- 🔌 Map Home Assistant entities to XCF layers
- 👁️ Control layer visibility based on entity states
- 📍 Display entity badges/icons at layer positions (new!)
- 🏠 Native Home Assistant card styling
- ⚡ Real-time updates when entity states change
- 🖱️ Click overlays to toggle entities

## Installation

### CDN (Recommended)

Use the card directly from a CDN without downloading:

```yaml
resources:
  # Latest version from jsDelivr
  - url: https://cdn.jsdelivr.net/npm/@theprogrammingiantpanda/ha-xcfimage-card@latest/dist/ha-xcfimage-card.js
    type: module

  # Or from unpkg
  - url: https://unpkg.com/@theprogrammingiantpanda/ha-xcfimage-card@latest/dist/ha-xcfimage-card.js
    type: module

  # Pin to a specific version (recommended for production)
  - url: https://cdn.jsdelivr.net/npm/@theprogrammingiantpanda/ha-xcfimage-card@0.1.0/dist/ha-xcfimage-card.js
    type: module
```

### Manual Installation

1. Download `ha-xcfimage-card.js` from the latest release
2. Copy it to `<config>/www/ha-xcfimage-card.js`
3. Add the resource to your Lovelace configuration:

```yaml
resources:
  - url: /local/ha-xcfimage-card.js
    type: module
```

## Configuration

### Visual Configuration Editor ✨ NEW

The card now includes a visual configuration editor in Home Assistant's UI! When you add or edit the card:

1. Click "+ ADD CARD" in Lovelace
2. Search for "XCF Image Card"
3. Use the visual editor to configure:
   - XCF file URL
   - Entity layers and/or entity overlays with **smart layer dropdowns**
   - Display options
   - Default visible layers

**Smart Layer Selection**: Once you enter your XCF file URL, the editor automatically loads the file and populates dropdowns with all available layers and their names - no need to manually look up layer indices!

**Flexible Configuration**: Use Entity Layers (for visibility toggling), Entity Overlays (for status badges), or both together for powerful combined visualizations!

See [VISUAL_CONFIG.md](./VISUAL_CONFIG.md) for detailed instructions.

### YAML Configuration

You can still configure the card manually with YAML:

#### Basic Example

```yaml
type: custom:ha-xcfimage-card
xcf_url: /local/floorplan.xcf
entity_layers:
  - entity: light.living_room
    layer: 0
  - entity: light.bedroom
    layer: 1
  - entity: switch.fan
    layer: 2
```

### Full Example

```yaml
type: custom:ha-xcfimage-card
title: Home Floor Plan
xcf_url: /local/home-floorplan.xcf
entity_layers:
  - entity: light.living_room
    layer: 0
    state_on: "on"
  - entity: light.bedroom
    layer: 1
    state_on: "on"
  - entity: binary_sensor.front_door
    layer: 3
    state_on: "on"
  - entity: climate.thermostat
    layer: 4
    state_on: "heat"
default_visible: [5, 6]  # Background layers always visible
forcevisible: false
```

## Two Modes of Operation

This card supports two modes that can be used separately or together:

### 1. Layer Visibility Mode (`entity_layers`)
Toggle XCF layer visibility based on entity states. When an entity is "on", its corresponding layer is shown.

### 2. Entity Overlay Mode (`entity_overlays`)
Display entity badges, icons, or states at layer positions. The layer's position (x, y, width, height) is used to place the entity display, but the layer's actual image content is not shown.

## Configuration Options

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | string | Yes | - | Must be `custom:ha-xcfimage-card` |
| `xcf_url` | string | Yes | - | URL to the XCF file (e.g., `/local/image.xcf`) |
| `entity_layers` | list | No* | - | List of entity-to-layer mappings for visibility control |
| `entity_overlays` | list | No* | - | List of entity overlays to display at layer positions |
| `title` | string | No | - | Card title |
| `default_visible` | list | No | `[]` | Layer indices that are always visible |
| `forcevisible` | boolean | No | `false` | Force all configured layers visible |

*At least one of `entity_layers` or `entity_overlays` is required

### Entity Layer Configuration

Each item in `entity_layers` has the following options:

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entity` | string | Yes | - | Home Assistant entity ID |
| `layer` | number | Yes | - | XCF layer index (0-based) |
| `state_on` | string | No | `"on"` | Entity state value that makes the layer visible |

### Entity Overlay Configuration

Each item in `entity_overlays` has the following options:

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entity` | string | Yes | - | Home Assistant entity ID |
| `layer` | number | Yes | - | XCF layer index for positioning (0-based) |
| `display_type` | string | No | `"badge"` | Display type: `badge`, `icon`, `state`, or `state-badge` |
| `show_icon` | boolean | No | Auto* | Show entity icon |
| `show_state` | boolean | No | Auto* | Show entity state |
| `show_name` | boolean | No | `false` | Show entity name |

*Auto-determined based on `display_type`:
- `badge`: icon + state in a row
- `state-badge`: icon above state in a column
- `icon`: icon only
- `state`: state text only

## Use Cases

### Entity Overlays - Interactive Floor Plan

Display entity controls at specific locations on your floor plan:

```yaml
type: custom:ha-xcfimage-card
title: Home Control
xcf_url: /local/floorplan.xcf
entity_overlays:
  - entity: light.kitchen
    layer: 0              # Kitchen position
    display_type: badge
  - entity: sensor.living_room_temp
    layer: 1              # Living room position
    display_type: state-badge
  - entity: climate.thermostat
    layer: 2              # Hallway position
    display_type: badge
  - entity: switch.garage_door
    layer: 3              # Garage position
    display_type: icon
default_visible: [10]     # Background floor plan
```

Create your XCF file with invisible layers positioned at each control point. The overlay will use the layer's position but won't display the layer itself.

### Mixed Mode - Visibility + Overlays

Combine both modes for advanced visualizations:

```yaml
type: custom:ha-xcfimage-card
title: Smart Home
xcf_url: /local/home.xcf
# Show/hide layers based on state
entity_layers:
  - entity: binary_sensor.motion_detected
    layer: 5
    state_on: "on"
# Display controls at specific positions
entity_overlays:
  - entity: light.main
    layer: 0
    display_type: badge
  - entity: sensor.temperature
    layer: 1
    display_type: state
default_visible: [10]
```

### Floor Plan (Layer Visibility)

Display a home floor plan where rooms light up based on which lights are on:

```yaml
type: custom:ha-xcfimage-card
title: Floor Plan
xcf_url: /local/floorplan.xcf
entity_layers:
  - entity: light.kitchen
    layer: 0
  - entity: light.living_room
    layer: 1
  - entity: light.bedroom
    layer: 2
default_visible: [10]  # Background floor plan layer
```

### Security Status

Show security status with different layers for doors, windows, and motion sensors:

```yaml
type: custom:ha-xcfimage-card
title: Security Status
xcf_url: /local/security.xcf
entity_layers:
  - entity: binary_sensor.front_door
    layer: 0
    state_on: "on"
  - entity: binary_sensor.back_door
    layer: 1
    state_on: "on"
  - entity: binary_sensor.motion_living
    layer: 2
    state_on: "on"
default_visible: [5]  # House outline
```

### Weather Visualization

Display weather conditions with different layers:

```yaml
type: custom:ha-xcfimage-card
title: Weather
xcf_url: /local/weather.xcf
entity_layers:
  - entity: weather.home
    layer: 0
    state_on: "sunny"
  - entity: weather.home
    layer: 1
    state_on: "rainy"
  - entity: weather.home
    layer: 2
    state_on: "cloudy"
```

## Creating XCF Files for Home Assistant

### For Layer Visibility Mode

1. Open GIMP and create your design
2. Use separate layers for each controllable element:
   - Layer 0: Kitchen light indicator
   - Layer 1: Living room light indicator
   - Layer 2: Background/base image
3. Name layers descriptively for easy identification
4. Save as `.xcf` file
5. Copy to Home Assistant's `www` folder (accessible as `/local/`)
6. Note the layer indices (0-based, bottom to top)

### For Entity Overlay Mode

1. Open GIMP with your background image
2. Create invisible placeholder layers at each position where you want an entity overlay:
   - Add a small rectangle or shape at the desired position
   - Make the layer invisible (or use low opacity during design)
   - Size the shape to set maximum bounds for the overlay
3. The layer's position (x, y) and size (width, height) will be used for overlay placement
4. The layer content itself won't be displayed - only its position matters
5. Example layer setup:
   - Layer 0: Small rectangle in kitchen area (for light control)
   - Layer 1: Small rectangle in living room (for temperature sensor)
   - Layer 10: Background floor plan (always visible)
6. Save as `.xcf` and copy to `www` folder

## Layer Index Reference

Layers in XCF files are indexed from bottom to top, starting at 0:

```
Layer 3 (index 3) ← Top layer
Layer 2 (index 2)
Layer 1 (index 1)
Layer 0 (index 0) ← Bottom layer
```

## Development

```bash
# Install dependencies
npm install

# Build the card
npm run build

# Lint
npm run lint
```

## License

MIT

## Credits

Built with [@theprogrammingiantpanda/ui-xcfimage](https://www.npmjs.com/package/@theprogrammingiantpanda/ui-xcfimage) and [@theprogrammingiantpanda/xcfreader](https://www.npmjs.com/package/@theprogrammingiantpanda/xcfreader).
