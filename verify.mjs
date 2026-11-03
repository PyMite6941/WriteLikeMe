import { strict as assert } from 'assert';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const WriteLikeMe = require('./index.js');

assert.equal(typeof WriteLikeMe.analyzeText, 'function');
assert.equal(typeof WriteLikeMe.generateStyleSVG, 'function');
assert.equal(typeof WriteLikeMe.DEFAULT_STYLE_CATEGORIES, 'object');
assert.equal(WriteLikeMe.analyzeText('').wordCount, 0);
assert.match(WriteLikeMe.generateStyleSVG(), /<svg\b/);

console.log('WriteLikeMe CommonJS exports verified.');
