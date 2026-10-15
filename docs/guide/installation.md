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

The analyzer returns seven broad scores plus additional voice cues such as
pronoun use, contractions, sentence variation, paragraph length, punctuation,
transitions, hedging, and frequent content words. The SVG shows seven broad
scores and stores the full profile in versioned metadata. Use
`compareTextStyle(referenceText, candidateText)` to compare a draft against a
reference sample. The analyzer and comparison use experimental heuristics;
they do not call an AI model or evaluate meaning. The built-in
`writeLikeMe(prompt, profile)` function creates a separate, deterministic,
template-based draft locally; it is not a language model. Punctuation balance
is not a grammar-correctness score. See the [analyzeText reference](/api/analyze-text)
and [style code guide](/api/style-code) for details and limitations.

## Command line

The package also installs the `writelike-me` command. The style-guided writer
uses the profile JSON embedded in a generated SVG and runs locally:

```bash
writelike-me analyze "A sample paragraph to analyze."
writelike-me generate "A sample paragraph to visualize." > writelikeme-code.svg
writelike-me write --style-code writelikeme-code.svg "Write a short paragraph about community gardens."
```

`analyze` prints the scores as JSON. `generate` writes an SVG to standard output;
without text it uses the default style profile. `write` produces a deterministic
template-based draft without calling an AI service. Its output is limited and
does not reliably follow complex instructions. In a local checkout, use
`npm run analyze -- "text"`, `npm run generate -- "text"`, and
`npm run write -- --style-code file.svg "prompt"`.

The SVG metadata contains the profile JSON and frequent words, not the original
sample. Inspect the file before sharing it.

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
