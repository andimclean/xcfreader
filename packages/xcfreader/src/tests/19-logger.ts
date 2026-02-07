import { Logger } from "../lib/logger.js";

export async function test19Logger(): Promise<void> {
  // Test: Logger methods do not throw
  try {
    Logger.info("info test");
    Logger.warn("warn test");
    Logger.error("error test");
    Logger.log("log test");
  } catch (_e) {
    throw new Error("Logger methods should not throw");
  }
  Logger.log("PASS: Logger methods called without error");
}
