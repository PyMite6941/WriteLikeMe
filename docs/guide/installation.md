# Installation

```bash
# Install WriteLikeMe via npm
npm install @pymite6941/writelikeme

# Or use from local path
npm link /home/pymite6941/services/local_storage/WriteLikeMe
```

## Quick Start

```javascript
import WriteLikeMe from '@pymite6941/writelikeme';

// Analyze text writing style
const analysis = WriteLikeMe.analyzeText('Your text here');
console.log(analysis);

// Generate SVG visualizer
const svg = WriteLikeMe.generateStyleSVG(analysis);
document.body.innerHTML = svg;
```
