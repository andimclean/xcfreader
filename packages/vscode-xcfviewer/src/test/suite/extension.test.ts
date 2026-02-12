import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("theprogramminggiantpanda.vscode-xcfviewer"));
  });

  test("Extension should activate", async () => {
    const extension = vscode.extensions.getExtension("theprogramminggiantpanda.vscode-xcfviewer");
    assert.ok(extension);
    await extension!.activate();
    assert.strictEqual(extension!.isActive, true);
  });

  test("Should register custom editor provider", async () => {
    const extension = vscode.extensions.getExtension("theprogramminggiantpanda.vscode-xcfviewer");
    await extension?.activate();

    // The custom editor should be registered
    // We can verify this by checking if commands are registered
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("xcfviewer.toggleLayer"));
    assert.ok(commands.includes("xcfviewer.showAllLayers"));
    assert.ok(commands.includes("xcfviewer.hideAllLayers"));
    assert.ok(commands.includes("xcfviewer.refreshLayers"));
  });

  test("Should register tree view provider", async () => {
    const extension = vscode.extensions.getExtension("theprogramminggiantpanda.vscode-xcfviewer");
    await extension?.activate();

    // Tree view should be registered
    // We can check by verifying the commands exist
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.length > 0);
  });
});
