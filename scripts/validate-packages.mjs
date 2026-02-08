#!/usr/bin/env node

/**
 * Validates consistency across all package.json files in the monorepo
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packages = [
  { name: 'root', path: path.join(rootDir, 'package.json') },
  { name: 'xcfreader', path: path.join(rootDir, 'packages/xcfreader/package.json') },
  { name: 'ui-xcfimage', path: path.join(rootDir, 'packages/ui-xcfimage/package.json') },
  { name: 'ha-xcfimage-card', path: path.join(rootDir, 'packages/ha-xcfimage-card/package.json') }
];

const issues = [];
const warnings = [];

// Read all package.json files
const pkgs = packages.map(({ name, path: pkgPath }) => {
  try {
    const content = readFileSync(pkgPath, 'utf-8');
    return { name, path: pkgPath, data: JSON.parse(content) };
  } catch (error) {
    issues.push(`❌ Failed to read ${name}: ${error.message}`);
    return null;
  }
}).filter(Boolean);

// Expected values (canonical)
const EXPECTED = {
  license: 'MIT',
  engines: {
    node: '>=18.0.0',
    npm: '>=9.0.0'
  },
  repository: {
    type: 'git',
    url: 'git+ssh://git@github.com/andimclean/xcfreader.git'
  },
  homepage: 'https://github.com/andimclean/xcfreader#readme'
};

// Validate each package (skip root for author/repository/homepage)
pkgs.forEach(({ name, data }) => {
  const isRoot = name === 'root';

  // Check license
  if (data.license !== EXPECTED.license) {
    issues.push(`❌ ${name}: license should be "${EXPECTED.license}", got "${data.license}"`);
  }

  // Check engines
  if (!data.engines) {
    issues.push(`❌ ${name}: missing "engines" field`);
  } else {
    if (data.engines.node !== EXPECTED.engines.node) {
      issues.push(`❌ ${name}: engines.node should be "${EXPECTED.engines.node}", got "${data.engines.node}"`);
    }
    if (data.engines.npm !== EXPECTED.engines.npm) {
      issues.push(`❌ ${name}: engines.npm should be "${EXPECTED.engines.npm}", got "${data.engines.npm}"`);
    }
  }

  // Skip repository/homepage/author checks for root (it's private)
  if (isRoot) return;

  // Check repository
  if (!data.repository) {
    issues.push(`❌ ${name}: missing "repository" field`);
  } else {
    if (data.repository.type !== EXPECTED.repository.type) {
      issues.push(`❌ ${name}: repository.type should be "${EXPECTED.repository.type}", got "${data.repository.type}"`);
    }
    if (data.repository.url !== EXPECTED.repository.url) {
      issues.push(`❌ ${name}: repository.url should be "${EXPECTED.repository.url}", got "${data.repository.url}"`);
    }
  }

  // Check homepage
  if (!data.homepage) {
    warnings.push(`⚠️  ${name}: missing "homepage" field`);
  } else if (data.homepage !== EXPECTED.homepage) {
    issues.push(`❌ ${name}: homepage should be "${EXPECTED.homepage}", got "${data.homepage}"`);
  }

  // Check author (just warn about inconsistencies)
  if (!data.author) {
    warnings.push(`⚠️  ${name}: missing "author" field`);
  }

  // Check publishConfig for public packages
  if (!isRoot && !data.publishConfig) {
    warnings.push(`⚠️  ${name}: missing "publishConfig" field`);
  } else if (!isRoot && data.publishConfig?.access !== 'public') {
    warnings.push(`⚠️  ${name}: publishConfig.access should be "public"`);
  }
});

// Check author consistency across packages
const authors = pkgs
  .filter(({ name }) => name !== 'root')
  .map(({ name, data }) => ({ name, author: data.author }));

const uniqueAuthors = [...new Set(authors.map(a => a.author))];
if (uniqueAuthors.length > 1) {
  warnings.push(`⚠️  Author field inconsistent across packages:`);
  authors.forEach(({ name, author }) => {
    warnings.push(`   - ${name}: "${author}"`);
  });
  warnings.push(`   Consider using consistent author across all packages`);
}

// Print results
console.log('\n📦 Package.json Validation Report\n');
console.log('=' .repeat(60));

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All package.json files are valid and consistent!\n');
} else {
  if (issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:\n');
    issues.forEach(issue => console.log(issue));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach(warning => console.log(warning));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary: ${issues.length} issue(s), ${warnings.length} warning(s)\n`);

  if (issues.length > 0) {
    process.exit(1);
  }
}
