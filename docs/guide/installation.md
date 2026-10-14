# Installation and quick start

```bash
npm install @ai-clyde/writelikeme
```

WriteLikeMe currently ships as a CommonJS package and supports Node.js 14 or newer.
Use a CommonJS `require` in Node.js, or import the package from a frontend project
that bundles CommonJS dependencies. The published entry is not a standalone browser
script, so adding it directly with a `<script src="...">` tag is not supported.

## Analyze text and write an SVG

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const analysis = WriteLikeMe.analyzeText('Your text here');
const svg = WriteLikeMe.generateStyleSVG(analysis);

fs.writeFileSync('writelikeme-code.svg', svg);
```

The analyzer uses text-length, token-variety, comma/period balance, and small
English keyword heuristics. Punctuation balance is not a grammar-correctness
score. Results are approximate and not an AI assessment; see the
[analyzeText reference](/api/analyze-text) for metric details and limitations.

## CommonJS import

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const result = WriteLikeMe.analyzeText('A sample sentence.');
```

## ES module import

Node.js can import the CommonJS default export:

```javascript
import WriteLikeMe from '@ai-clyde/writelikeme';
```
