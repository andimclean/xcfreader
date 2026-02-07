# Visual Configuration Editor

The ha-xcfimage-card now includes a visual configuration editor that appears in Home Assistant's UI when you add or edit the card.

## How to Use

1. **Add the Card**
   - In Home Assistant's Lovelace UI, click "Edit Dashboard"
   - Click "+ ADD CARD"
   - Search for "XCF Image Card"
   - The visual editor will appear

2. **Configure the Card**

   ### Basic Settings
   - **Card Title**: Optional title displayed at the top of the card
   - **XCF File URL**: Path to your GIMP XCF file (e.g., `/local/floorplan.xcf`)
     - Once you enter a valid URL, the editor will automatically load the XCF file and populate the layer dropdowns with available layers and their names

   ### Configuration Options

   You can configure either or both of the following options. Use them independently or combine them for advanced setups:

   #### Entity Layers (Optional)
   - Toggle layer visibility based on entity states
   - For each entity layer:
     - **Entity**: The Home Assistant entity ID (e.g., `light.living_room`)
     - **Layer**: Select from a dropdown of available layers (automatically populated from your XCF file)
       - Shows layer index and name (e.g., "0: Background", "1: Living Room Light")
       - If XCF file hasn't loaded yet, you can manually enter a layer index
     - **State On**: The state value that makes the layer visible (default: "on")

   #### Entity Overlays (Optional)
   - Display entity badges/icons at layer positions
   - For each entity overlay:
     - **Entity**: The Home Assistant entity ID
     - **Layer**: Select from a dropdown of available layers (automatically populated from your XCF file)
       - The layer's position in the XCF file determines where the overlay appears
       - If XCF file hasn't loaded yet, you can manually enter a layer index
     - **Display Type**:
       - `badge` - Icon + state in a row
       - `state-badge` - Icon above state in a column
       - `icon` - Just the icon
       - `state` - Just the state text

   ### Advanced Options
   - **Default Visible Layers**: Comma-separated layer indices that are always visible (e.g., `0,1,5`)
   - **Force all configured layers visible**: Checkbox to override visibility settings

3. **Save the Configuration**
   - Click "SAVE" to apply your configuration
   - The card will immediately update with your settings

## Features

- **Add/Remove Entities**: Use the "+ Add Entity Layer/Overlay" button to add more entities, or "Remove" to delete them
- **Mode Switching**: Switch between Entity Layers and Entity Overlays modes as needed
- **Live Preview**: Changes appear immediately when you save
- **Validation**: The editor validates your configuration before saving

## Example Configurations

### Floor Plan with Lights
Using Entity Layers only:
1. Entity Layers:
   - `light.living_room` → Layer 0
   - `light.kitchen` → Layer 1
   - `light.bedroom` → Layer 2
2. Default Visible: `10` (background layer)

### Smart Home Control Panel
Using Entity Overlays only:
1. Entity Overlays:
   - `light.kitchen` → Layer 0 → Display Type: badge
   - `sensor.temperature` → Layer 1 → Display Type: state-badge
   - `switch.fan` → Layer 2 → Display Type: icon
2. Default Visible: `20,21` (background layers)

### Combined Mode - Advanced Floor Plan
Using both Entity Layers and Entity Overlays together:
1. Entity Layers (toggle room light glows):
   - `light.living_room` → Layer 0
   - `light.kitchen` → Layer 1
2. Entity Overlays (show status badges):
   - `sensor.living_room_temp` → Layer 10 → Display Type: state-badge
   - `binary_sensor.front_door` → Layer 11 → Display Type: icon
   - `climate.thermostat` → Layer 12 → Display Type: badge
3. Default Visible: `50` (floor plan background)

This allows you to both show/hide room lighting effects AND display entity information overlays simultaneously!

## Tips

- **Layer Selection Made Easy**: The editor automatically loads your XCF file and shows all available layers in dropdowns with their names - no need to manually look up layer indices!
- **Use Both Modes**: You can combine Entity Layers (for visibility toggling) and Entity Overlays (for status badges) in the same card for powerful visualizations
- Layer indices are 0-based (first layer is 0)
- Use GIMP to create your XCF file with descriptive layer names
- Background layers (always visible) should be added to "Default Visible Layers"
- Entity overlays position is determined by the XCF layer's position, not its content
- Click the entity overlays to toggle them (turn on/off)
- If the XCF file fails to load, you can still manually enter layer numbers
- At least one of Entity Layers or Entity Overlays must be configured
