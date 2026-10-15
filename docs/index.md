---
layout: home

hero:
  name: Writing style visualization
  text: See the patterns behind your writing.
  tagline: Analyze writing locally, share a portable style profile, and create a simple style-guided draft without an AI service.
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
    details: Get experimental style scores plus voice cues for perspective, contractions, sentence variation, paragraph length, punctuation, transitions, and hedging.
  - title: Create a style code
    details: Preview the seven-band circular pattern, copy runnable JavaScript, and download the square SVG.
  - title: Write and compare drafts
    details: Create a simple template-based draft locally, or compare another draft against the user's sample with heuristic signals.
  - title: Run it locally
    details: Text is analyzed in your browser; the demo does not send it to a server or call an AI model.
---

<script setup>
import StyleDemo from './.vitepress/theme/StyleDemo.vue'
</script>

## Quick start {#quick-start}

Try a sample or paste your own writing to generate an analysis profile and
QR-inspired SVG code in the browser. The SVG includes the full profile as
versioned metadata so it can be shared and read back into the package. Use
`writeLikeMe(prompt, profile)` for a basic local template-based draft, or use
`compareTextStyle` to compare another draft with a reference sample. Neither
function calls an AI service.

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

Explore the [installation guide](/guide/installation), [API reference](/api/analyze-text), [style-code and local-writing guide](/api/style-code), and [examples](/examples/basic-usage) for more details.
