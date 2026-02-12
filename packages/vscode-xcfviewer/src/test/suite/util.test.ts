import * as assert from "assert";
import { getNonce } from "../../util";

suite("Util Test Suite", () => {
  test("getNonce should return a 32-character string", () => {
    const nonce = getNonce();
    assert.strictEqual(nonce.length, 32);
  });

  test("getNonce should return different values on each call", () => {
    const nonce1 = getNonce();
    const nonce2 = getNonce();
    assert.notStrictEqual(nonce1, nonce2);
  });

  test("getNonce should only contain alphanumeric characters", () => {
    const nonce = getNonce();
    const alphanumericRegex = /^[A-Za-z0-9]+$/;
    assert.ok(alphanumericRegex.test(nonce));
  });
});
