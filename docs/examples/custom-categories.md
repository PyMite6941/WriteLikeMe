# Custom Categories

You can customize which categories to display and their weights:

```javascript
import WriteLikeMe from '@pymite6941/writelikeme';

// Analyze text
const analysis = WriteLikeMe.analyzeText('Your text here');

// Generate SVG with custom category weights
const svg = WriteLikeMe.generateStyleSVG({
  formality: 0.9,   // Very formal
  complexity: 0.3,  // Simple vocabulary
  creativity: 0.8,  // High creativity
  // Other categories use defaults (0.5)
});

// The SVG will show customized circle sizes/colors
document.body.innerHTML = '<div>' + svg + '</div>';
```
