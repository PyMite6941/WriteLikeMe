# generateStyleSVG

Generate an SVG visualizer representing writing style characteristics as circles.

## Syntax

```javascript
const svg = WriteLikeMe.generateStyleSVG(categories, width, height);
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `categories` | `object` | `{}` | Object with category weights (0-1) |
| `width` | `number` | `400` | SVG canvas width |
| `height` | `number` | `400` | SVG canvas height |

## Returns

A string containing valid SVG markup with:
- 6 colored circles representing: formality, complexity, sentence_length, vocabulary, tone, creativity
- Labels below each circle showing the percentage value
- Central export message

## Example

```javascript
import WriteLikeMe from '@pymite6941/writelikeme';

const analysis = WriteLikeMe.analyzeText('Your text here');
const svg = WriteLikeMe.generateStyleSVG(analysis);

document.body.innerHTML = svg;
/* Output: SVG with 6 circles showing formality, complexity, etc. */
*/
