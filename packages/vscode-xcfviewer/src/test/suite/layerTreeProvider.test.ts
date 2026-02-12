import * as assert from "assert";
import { LayerTreeProvider } from "../../layerTreeProvider";

suite("LayerTreeProvider Test Suite", () => {
  let provider: LayerTreeProvider;

  setup(() => {
    provider = new LayerTreeProvider();
  });

  test("Should create LayerTreeProvider instance", () => {
    assert.ok(provider);
  });

  test("Should return empty array when no editor is set", async () => {
    const children = await provider.getChildren();
    assert.strictEqual(children.length, 0);
  });

  test("Should handle refresh without errors", () => {
    assert.doesNotThrow(() => {
      provider.refresh();
    });
  });

  test("Should handle showAllLayers without errors", () => {
    assert.doesNotThrow(() => {
      provider.showAllLayers();
    });
  });

  test("Should handle hideAllLayers without errors", () => {
    assert.doesNotThrow(() => {
      provider.hideAllLayers();
    });
  });

  test("Should set editor", () => {
    assert.doesNotThrow(() => {
      provider.setEditor(undefined);
    });
  });
});
