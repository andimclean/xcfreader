# @theprogrammingiantpanda/ng-xcfimage

Angular 19 component for rendering GIMP XCF files using [xcfreader](../xcfreader).

## Installation

```bash
npm install @theprogrammingiantpanda/ng-xcfimage
```

## Usage

```typescript
import { XcfImageComponent } from "@theprogrammingiantpanda/ng-xcfimage";

@Component({
  imports: [XcfImageComponent],
  template: `
    <gpp-xcfimage
      [src]="xcfUrl"
      [visible]="'0,2,5'"
      [loading]="'lazy'"
      [alt]="'My XCF image'"
      (xcfLoaded)="onLoaded($event)"
      (xcfError)="onError($event)"
    />
  `,
})
export class MyComponent {
  xcfUrl = "/assets/image.xcf";

  onLoaded(event: XcfLoadedEvent) {
    console.log("Loaded:", event.layerCount, "layers");
  }

  onError(event: XcfErrorEvent) {
    console.error("Failed:", event.error);
  }
}
```

## Inputs

| Input           | Type                | Default   | Description                                    |
| --------------- | ------------------- | --------- | ---------------------------------------------- |
| `src`           | `string`            | `''`      | URL of the XCF file to load                    |
| `visible`       | `string`            | `''`      | Comma-separated layer indices to show          |
| `forcevisible`  | `boolean`           | `false`   | Force specified layers visible                 |
| `loading`       | `'lazy' \| 'eager'` | `'eager'` | Load strategy (lazy uses IntersectionObserver) |
| `alt`           | `string`            | `''`      | Alternative text for accessibility             |
| `retryAttempts` | `number`            | `3`       | Number of retry attempts for failed requests   |
| `retryDelay`    | `number`            | `1000`    | Initial delay in ms for exponential backoff    |

## Outputs

| Output        | Type               | Description                      |
| ------------- | ------------------ | -------------------------------- |
| `xcfLoading`  | `XcfLoadingEvent`  | Emitted when loading starts      |
| `xcfLoaded`   | `XcfLoadedEvent`   | Emitted when loading succeeds    |
| `xcfError`    | `XcfErrorEvent`    | Emitted after all retries fail   |
| `xcfRetrying` | `XcfRetryingEvent` | Emitted on each retry attempt    |
| `xcfActivate` | `void`             | Emitted on Enter/Space key press |

## Readable State

Access component state via template or `ViewChild`:

- `layers` - Parsed layer tree (`Signal<XcfLayerNode | null>`)
- `state` - Component state (`Signal<'idle' | 'loading' | 'loaded' | 'error'>`)

## License

MIT
