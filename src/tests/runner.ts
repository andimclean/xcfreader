import { test01ParseSingle } from './01-parse-single.js';
import { test02CreateImage } from './02-create-image.js';
import { test03ParseMulti } from './03-parse-multi.js';
import { test04Map1Layers } from './04-map1-layers.js';
import { test05TextParasites } from './05-text-parasites.js';
import { test06ParseEmpty } from './06-parse-empty.js';

const tests = [
  { name: '01-parse-single.ts', fn: test01ParseSingle },
  { name: '02-create-image.ts', fn: test02CreateImage },
  { name: '03-parse-multi.ts', fn: test03ParseMulti },
  { name: '04-map1-layers.ts', fn: test04Map1Layers },
  { name: '05-text-parasites.ts', fn: test05TextParasites },
  { name: '06-parse-empty.ts', fn: test06ParseEmpty }
];

async function runTests(): Promise<void> {
  for (const test of tests) {
    console.log(`Running ${test.name}`);
    try {
      await test.fn();
    } catch (error) {
      console.error(`FAIL: ${test.name} - ${error}`);
      process.exit(1);
    }
  }
  console.log('All tests passed');
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
