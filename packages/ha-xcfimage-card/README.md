# Home Assistant XCF Image Card

A custom Home Assistant card that displays GIMP XCF files with layer visibility controlled by Home Assistant entities.

## Features

- 🎨 Display GIMP XCF files directly in Home Assistant
- 🔌 Map Home Assistant entities to XCF layers
- 👁️ Control layer visibility based on entity states
- 🏠 Native Home Assistant card styling
- ⚡ Real-time updates when entity states change

## Installation

### HACS (Recommended)

1. Add this repository to HACS as a custom repository
2. Install "XCF Image Card" through HACS
3. Add the resource to your Lovelace configuration

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

### Basic Example

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

## Configuration Options

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | string | Yes | - | Must be `custom:ha-xcfimage-card` |
| `xcf_url` | string | Yes | - | URL to the XCF file (e.g., `/local/image.xcf`) |
| `entity_layers` | list | Yes | - | List of entity-to-layer mappings |
| `title` | string | No | - | Card title |
| `default_visible` | list | No | `[]` | Layer indices that are always visible |
| `forcevisible` | boolean | No | `false` | Force all configured layers visible |

### Entity Layer Configuration

Each item in `entity_layers` has the following options:

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `entity` | string | Yes | - | Home Assistant entity ID |
| `layer` | number | Yes | - | XCF layer index (0-based) |
| `state_on` | string | No | `"on"` | Entity state value that makes the layer visible |

## Use Cases

### Floor Plan

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

1. Open GIMP and create your design
2. Use separate layers for each controllable element:
   - Layer 0: Kitchen light indicator
   - Layer 1: Living room light indicator
   - Layer 2: Background/base image
3. Name layers descriptively for easy identification
4. Save as `.xcf` file
5. Copy to Home Assistant's `www` folder (accessible as `/local/`)
6. Note the layer indices (0-based, bottom to top)

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
