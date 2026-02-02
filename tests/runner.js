import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const testsDir = path.resolve(path.dirname(''), 'tests');

function listTests() {
  return fs
    .readdirSync(testsDir)
    .filter((f) => /^[0-9]{2}-.*\.js$/.test(f))
    .sort();
}

async function run() {
  const tests = listTests();
  if (tests.length === 0) {
    console.log('No tests found');
    process.exit(0);
  }

  for (const t of tests) {
    const file = path.resolve(testsDir, t);
    console.log('Running', t);
    try {
      await import(pathToFileURL(file).href);
    } catch (err) {
      console.error('FAIL', t);
      console.error(err && err.stack ? err.stack : err);
      process.exit(1);
    }
  }
  console.log('All tests passed');
}

run();
