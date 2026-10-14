# Basic Usage

Analyze text, create an SVG, and save it to a file:

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const text = 'A sample paragraph to inspect.';
const profile = WriteLikeMe.analyzeText(text);
const svg = WriteLikeMe.generateStyleSVG(profile);

console.log(profile);
fs.writeFileSync('writelikeme-code.svg', svg);
```

The analyzer uses simple text-shape and English keyword heuristics. Results are
experimental rather than AI assessments. See the [analyzeText API reference](/api/analyze-text)
before interpreting the scores.

The published entry point is CommonJS, not a standalone browser script. Use a
frontend build tool that supports CommonJS dependencies to include it in a
browser application.
