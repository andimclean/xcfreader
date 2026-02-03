# ui-xcfimage

A web component `<gpp-xcfimage>` for rendering GIMP XCF files using xcfreader.

## Usage

```
<gpp-xcfimage src="/path/to/file.xcf" visible="Layer 1,Layer 2" forcevisible></gpp-xcfimage>
```

- `src`: URL to the XCF file
- `visible`: Comma-separated list of layer names to display (optional)
- `forcevisible`: If present, forces layers in `visible` to be shown even if hidden in the file

## Development

- Build: `npm run build`
- Source: `src/gpp-xcfimage.ts`

## How it works

- Downloads and parses the XCF file using xcfreader (browser bundle)
- Renders only the specified visible layers, optionally overriding their visibility
- Uses a shadow DOM canvas for rendering

## Example

```
<gpp-xcfimage src="/images/art.xcf" visible="Background,Text" forcevisible></gpp-xcfimage>
```

## License

MIT
