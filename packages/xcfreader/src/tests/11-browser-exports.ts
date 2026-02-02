import { Logger } from '../lib/logger.js';

// Test that browser entry point exports the expected classes
export async function test11BrowserExports(): Promise<void> {
  // Dynamic import to test the browser module exports
  const browserModule = await import('../browser.js');
  
  // Check that XCFParser is exported
  if (typeof browserModule.XCFParser !== 'function') {
    throw new Error('browser.ts does not export XCFParser');
  }
  
  // Check that XCFDataImage is exported
  if (typeof browserModule.XCFDataImage !== 'function') {
    throw new Error('browser.ts does not export XCFDataImage');
  }
  
  // Check that XCFParseError is exported
  if (typeof browserModule.XCFParseError !== 'function') {
    throw new Error('browser.ts does not export XCFParseError');
  }
  
  // Check that UnsupportedFormatError is exported
  if (typeof browserModule.UnsupportedFormatError !== 'function') {
    throw new Error('browser.ts does not export UnsupportedFormatError');
  }
  
  // Check that XCFPNGImage is NOT exported (should be undefined)
  if ((browserModule as Record<string, unknown>).XCFPNGImage !== undefined) {
    throw new Error('browser.ts should NOT export XCFPNGImage');
  }
  
  // Test node entry point exports
  const nodeModule = await import('../node.js');
  
  // Check that XCFPNGImage IS exported from node
  if (typeof nodeModule.XCFPNGImage !== 'function') {
    throw new Error('node.ts does not export XCFPNGImage');
  }
  
  // Check that XCFDataImage is also exported from node
  if (typeof nodeModule.XCFDataImage !== 'function') {
    throw new Error('node.ts does not export XCFDataImage');
  }
  
  // Check that XCFParser is exported from node
  if (typeof nodeModule.XCFParser !== 'function') {
    throw new Error('node.ts does not export XCFParser');
  }
  
  Logger.log('PASS: browser and node entry points export correct classes');
}
