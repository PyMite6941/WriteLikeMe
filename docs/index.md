---
layout: home

hero:
  name: Writing style visualization
  text: See the patterns behind your writing.
  tagline: Analyze writing style locally, then transform its signals into a compact, QR-inspired WriteLikeMe Code.
  actions:
    - theme: brand
      text: Get started
      link: '#quick-start'
    - theme: alt
      text: View on GitHub
      link: https://github.com/PyMite6941/WriteLikeMe
    - theme: alt
      text: npm package
      link: https://www.npmjs.com/package/@ai-clyde/writelikeme

features:
  - title: Analyze writing style
    details: Get an experimental writing profile from text shape, vocabulary variety, and keyword signals.
  - title: Create a style code
    details: Preview the circular signal pattern, copy runnable JavaScript, and download the square SVG.
  - title: Run it locally
    details: Text is analyzed in your browser; the sample editor does not send text to a server.
---

<script setup>
import StyleDemo from './.vitepress/theme/StyleDemo.vue'
</script>

## Quick start {#quick-start}

Try a sample or paste your own writing to generate a profile and QR-inspired SVG code in the browser.

<StyleDemo />

To use the same API in Node.js, install the package and run:

### Install

```bash
npm install @ai-clyde/writelikeme
```

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const text = 'A short sample paragraph.';
const profile = WriteLikeMe.analyzeText(text);
const svg = WriteLikeMe.generateStyleSVG(profile);
fs.writeFileSync('writelikeme-code.svg', svg);
```

Explore the [installation guide](/guide/installation), [API reference](/api/analyze-text), and [examples](/examples/basic-usage) for more details.
