// Checks that the published tarball contains every file the package needs:
// the bin, the main entry, and everything they require() locally.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pkg = require('./package.json');

const packed = JSON.parse(execSync('npm pack --dry-run --json', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
const files = new Set(packed[0].files.map((file) => file.path.replace(/\\/g, '/')));

const entries = [pkg.main].concat(Object.values(pkg.bin || {})).map((file) => file.replace(/^\.\//, ''));
const seen = new Set();
(function walk(list) {
  list.forEach((file) => {
    if (seen.has(file)) return;
    seen.add(file);
    assert.ok(files.has(file), `${file} is missing from the published package`);
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const local = [...source.matchAll(/require\(['"](\.\/[^'"]+)['"]\)/g)]
      .map((match) => path.posix.normalize(match[1]))
      .map((dep) => (/\.(js|json)$/.test(dep) ? dep : dep + '.js'));
    walk(local);
  });
})(entries);

assert.ok(files.has('README.md'), 'README is published');
assert.ok(fs.readFileSync(path.join(__dirname, pkg.bin['writelike-me']), 'utf8').startsWith('#!/usr/bin/env node'), 'bin has a node shebang');
assert.ok(![...files].some((file) => /\.test\.js$|^docs\//.test(file)), 'tests and docs are not published');
console.log(`Package contents verified (${[...seen].join(', ')}).`);
