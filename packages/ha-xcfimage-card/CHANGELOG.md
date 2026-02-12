# Changelog

## 0.3.0

### Minor Changes

- New features and improvements:
  - **Visual Configuration Editor**: Complete UI editor with smart layer dropdowns that automatically load layer names from XCF files. Supports both Entity Layers (visibility control) and Entity Overlays (status badges).
  - **Entity Overlay Positioning**: Display entity status badges/icons at specific x/y coordinates with full support for Home Assistant click actions.
  - **CDN Installation Support**: Use the card directly from jsDelivr or unpkg without downloads, with version pinning for production stability.

  Enhanced developer experience with live XCF file parsing and no need to manually look up layer indices.

All notable changes to the ha-xcfimage-card package will be documented in this file.

## [Unreleased]

## [0.2.0] - 2026-02-07

### Added

- **Visual Configuration Editor** - Complete UI editor for card configuration in Home Assistant
  - Smart layer dropdowns that automatically load and display layer names from XCF files
  - Dual configuration modes: Entity Layers (visibility control) and Entity Overlays (status badges)
  - Live XCF file parsing to populate layer selection dropdowns
  - No need to manually look up layer indices
  - Full support for all card features including click actions and positioning

- **Entity Overlay Positioning** - Display entity status badges/icons at layer positions
  - Position badges at specific x/y coordinates on the card
  - Support for standard Home Assistant badge click actions (toggle, more-info, navigate, etc.)
  - Can be used alongside or instead of entity layers
  - Flexible configuration for complex visualizations

- **CDN Installation Support** - Use the card directly from jsDelivr or unpkg without downloads
  - Latest version: `@latest` tag for easy updates
  - Version pinning for production stability
  - Simplified installation workflow

### Changed

- Improved README with visual configuration editor documentation
- Enhanced YAML configuration examples
- Updated package dependencies

## [0.1.0] - 2024-01-XX

### Added

- Initial release of Home Assistant XCF Image Card
- Entity-based layer visibility control
- Support for custom state values (`state_on`)
- Default visible layers configuration
- Card title support
- Loading and error states
- Real-time updates when entity states change
- Native Home Assistant card styling
- Demo HTML page for testing
- Comprehensive README and installation guide

### Features

- Map Home Assistant entities to XCF layers
- Control layer visibility based on entity states
- Always-visible background layers
- Custom state matching (not just "on"/"off")
- Responsive design
- Error handling with user-friendly messages
