import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component, ViewChild } from "@angular/core";
import { XcfImageComponent } from "./xcf-image.component";
import { XcfFetchService } from "./xcf-fetch.service";
import { XCFParser } from "@theprogrammingiantpanda/xcfreader/browser";
import type { XcfLoadingEvent, XcfLoadedEvent, XcfErrorEvent } from "./xcf-image.types";

// xcfreader/browser is mapped to __mocks__/xcfreader-browser.ts via moduleNameMapper
const mockParseBuffer = XCFParser.parseBuffer as jest.Mock;

function createMockParser(): object {
  return {
    width: 100,
    height: 100,
    layers: [
      {
        name: "Background",
        isVisible: true,
        isGroup: false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        makeImage: jest.fn(),
      },
    ],
    groupLayers: {
      children: [
        {
          layer: {
            name: "Background",
            isVisible: true,
            isGroup: false,
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
          children: [],
        },
      ],
    },
  };
}

@Component({
  standalone: true,
  imports: [XcfImageComponent],
  template: `
    <gpp-xcfimage
      #xcf
      [src]="src"
      [visible]="visible"
      [forcevisible]="forcevisible"
      [loading]="loading"
      [alt]="alt"
      [retryAttempts]="retryAttempts"
      [retryDelay]="retryDelay"
      (xcfLoading)="onLoading($event)"
      (xcfLoaded)="onLoaded($event)"
      (xcfError)="onError($event)"
      (xcfActivate)="onActivate()"
    />
  `,
})
class TestHostComponent {
  @ViewChild("xcf") xcfComponent!: XcfImageComponent;

  src = "";
  visible = "";
  forcevisible = false;
  loading: "lazy" | "eager" = "eager";
  alt = "";
  retryAttempts = 3;
  retryDelay = 1000;

  loadingEvents: XcfLoadingEvent[] = [];
  loadedEvents: XcfLoadedEvent[] = [];
  errorEvents: XcfErrorEvent[] = [];
  activateCount = 0;

  onLoading(event: XcfLoadingEvent): void {
    this.loadingEvents.push(event);
  }
  onLoaded(event: XcfLoadedEvent): void {
    this.loadedEvents.push(event);
  }
  onError(event: XcfErrorEvent): void {
    this.errorEvents.push(event);
  }
  onActivate(): void {
    this.activateCount++;
  }
}

describe("XcfImageComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let mockFetchService: { fetchWithRetry: jest.Mock };

  beforeEach(async () => {
    mockFetchService = { fetchWithRetry: jest.fn() };
    mockParseBuffer.mockReset();

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    })
      .overrideProvider(XcfFetchService, { useValue: mockFetchService })
      .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // --- Creation & defaults ---

  it("should create the component", () => {
    expect(host.xcfComponent).toBeTruthy();
  });

  it("should have correct default input values", () => {
    const comp = host.xcfComponent;
    expect(comp.src()).toBe("");
    expect(comp.visible()).toBe("");
    expect(comp.forcevisible()).toBe(false);
    expect(comp.loading()).toBe("eager");
    expect(comp.alt()).toBe("");
    expect(comp.retryAttempts()).toBe(3);
    expect(comp.retryDelay()).toBe(1000);
  });

  // --- ARIA / accessibility ---

  it("should have role=img and tabindex=0 on host", () => {
    const hostEl: HTMLElement = fixture.debugElement.children[0].nativeElement;
    expect(hostEl.getAttribute("role")).toBe("img");
    expect(hostEl.getAttribute("tabindex")).toBe("0");
  });

  it("should default aria-label to XCF Image when no src or alt", () => {
    const hostEl: HTMLElement = fixture.debugElement.children[0].nativeElement;
    expect(hostEl.getAttribute("aria-label")).toBe("XCF Image");
  });

  it("should use alt text for aria-label when provided", () => {
    host.alt = "My test image";
    fixture.detectChanges();

    const hostEl: HTMLElement = fixture.debugElement.children[0].nativeElement;
    expect(hostEl.getAttribute("aria-label")).toBe("My test image");
  });

  it("should use src-based aria-label when src set but no alt", async () => {
    // Mock fetch to reject so the async load settles
    mockFetchService.fetchWithRetry.mockRejectedValue(new Error("ignored"));

    host.src = "test.xcf";
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl: HTMLElement = fixture.debugElement.children[0].nativeElement;
    expect(hostEl.getAttribute("aria-label")).toBe("XCF Image: test.xcf");
  });

  // --- Keyboard interaction ---

  it("should emit xcfActivate on Enter key", () => {
    const hostEl: HTMLElement = fixture.debugElement.children[0].nativeElement;
    hostEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(host.activateCount).toBe(1);
  });

  it("should emit xcfActivate on Space key", () => {
    const hostEl: HTMLElement = fixture.debugElement.children[0].nativeElement;
    hostEl.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(host.activateCount).toBe(1);
  });

  // --- Loading lifecycle ---

  it("should emit xcfLoading then xcfLoaded on successful load", async () => {
    mockParseBuffer.mockReturnValue(createMockParser());
    mockFetchService.fetchWithRetry.mockResolvedValue(new ArrayBuffer(32));

    host.src = "https://example.com/test.xcf";
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.loadingEvents).toHaveLength(1);
    expect(host.loadingEvents[0]).toEqual({
      src: "https://example.com/test.xcf",
    });

    expect(host.loadedEvents).toHaveLength(1);
    expect(host.loadedEvents[0]).toEqual(
      expect.objectContaining({
        src: "https://example.com/test.xcf",
        width: 100,
        height: 100,
        layerCount: 1,
      })
    );

    expect(host.xcfComponent.state()).toBe("loaded");
  });

  it("should emit xcfError on fetch failure", async () => {
    mockFetchService.fetchWithRetry.mockRejectedValue(new Error("Network timeout"));

    host.src = "https://example.com/broken.xcf";
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.errorEvents).toHaveLength(1);
    expect(host.errorEvents[0]).toEqual({
      src: "https://example.com/broken.xcf",
      error: "Network timeout",
    });

    expect(host.xcfComponent.state()).toBe("error");
  });

  // --- Error overlay ---

  it("should show error overlay with retry button in error state", async () => {
    mockFetchService.fetchWithRetry.mockRejectedValue(new Error("Load failed"));

    host.src = "https://example.com/fail.xcf";
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector(".error-overlay");
    expect(overlay).toBeTruthy();

    const retryButton = fixture.nativeElement.querySelector(".retry-button");
    expect(retryButton).toBeTruthy();
    expect(retryButton.textContent).toContain("Retry");
  });

  it("should retry loading when retry button is clicked", async () => {
    mockFetchService.fetchWithRetry.mockRejectedValue(new Error("Load failed"));

    host.src = "https://example.com/fail.xcf";
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Set up successful response for retry
    mockParseBuffer.mockReturnValue({
      width: 50,
      height: 50,
      layers: [],
      groupLayers: { children: [] },
    });
    mockFetchService.fetchWithRetry.mockResolvedValue(new ArrayBuffer(8));

    const retryButton: HTMLButtonElement = fixture.nativeElement.querySelector(".retry-button");
    retryButton.click();
    fixture.detectChanges();

    expect(host.xcfComponent.state()).toBe("loading");

    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.xcfComponent.state()).toBe("loaded");
  });
});
