# Custom Categories

Pass custom scores to control the six score bands in the generated code. Scores should be
numeric values from `0` to `1`; omitted categories use `0.5`.

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const svg = WriteLikeMe.generateStyleSVG({
  formality: 0.9,
  complexity: 0.3,
  sentence_length: 0,
  creativity: 0.8
});

fs.writeFileSync('writelikeme-code.svg', svg);
```

Values in this example are supplied directly to customize the generated SVG.
The analyzer can also provide heuristic scores for each category. See the
[generateStyleSVG API reference](/api/generate-style-svg) for supported keys
and defaults.
