import { XCFDataImage } from '../browser.js';
import { Logger } from '../lib/logger.js';

export async function test12ToBlobAndDataURL(): Promise<void> {
  const image = new XCFDataImage(10, 10);
  
  // Fill with some test data
  image.fillRect(0, 0, 10, 10, { red: 255, green: 0, blue: 0, alpha: 255 });

  // Test that toBlob method exists
  if (typeof image.toBlob !== 'function') {
    throw new Error('XCFDataImage.toBlob method does not exist');
  }

  // Test that toDataURL method exists
  if (typeof image.toDataURL !== 'function') {
    throw new Error('XCFDataImage.toDataURL method does not exist');
  }

  // In Node.js environment, these should throw errors about browser environment
  try {
    await image.toBlob();
    throw new Error('toBlob() should throw in Node.js environment');
  } catch (err) {
    if (err instanceof Error && err.message.includes('browser environment')) {
      // Expected error
    } else {
      throw err;
    }
  }

  try {
    image.toDataURL();
    throw new Error('toDataURL() should throw in Node.js environment');
  } catch (err) {
    if (err instanceof Error && err.message.includes('browser environment')) {
      // Expected error
    } else {
      throw err;
    }
  }

  Logger.log('PASS: toBlob() and toDataURL() methods exist and handle Node.js environment correctly');
}
