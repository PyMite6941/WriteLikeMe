# Basic Usage

Analyze text, create an SVG, and save it to a file:

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const text = 'A sample paragraph to inspect.';
const profile = WriteLikeMe.analyzeText(text);
const svg = WriteLikeMe.generateStyleSVG(profile);

console.log(profile);
const generatedDraft = 'A draft produced by your AI integration.';
console.log(WriteLikeMe.compareTextStyle(text, generatedDraft));
fs.writeFileSync('writelikeme-code.svg', svg);

const sharedProfile = WriteLikeMe.readStyleCode(svg);
const localDraft = WriteLikeMe.writeLikeMe(
  'Write a short paragraph about community gardens.',
  sharedProfile
);
console.log(localDraft);
```

`compareTextStyle` gives an experimental style-match score and per-signal
differences that an AI integration can use to review or refine its draft.
`readStyleCode` restores the JSON profile embedded in the SVG, and
`writeLikeMe` uses it to make a deterministic draft locally. The built-in writer
does not call an AI service and has limited ability to follow complex prompts.

The analyzer uses simple text-shape and English keyword heuristics. Results are
experimental rather than AI assessments. See the [analyzeText API reference](/api/analyze-text)
before interpreting the scores.

The published entry point is CommonJS, not a standalone browser script. Use a
frontend build tool that supports CommonJS dependencies to include it in a
browser application.
