# Basic Usage

```javascript
import WriteLikeMe from '@pymite6941/writelikeme';

// Example 1: Analyze text and generate SVG
const text = "This is a formal business proposal regarding quarterly financial results.";
const analysis = WriteLikeMe.analyzeText(text);
const svg = WriteLikeMe.generateStyleSVG(analysis);

// Display in HTML
document.body.innerHTML = '<div>' + svg + '</div>';

console.log('Style analysis:', analysis);
// Output: { formality: 0.8, complexity: 0.6, ... }
```
