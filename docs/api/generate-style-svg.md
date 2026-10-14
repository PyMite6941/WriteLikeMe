# generateStyleSVG

Generate a compact, square, QR-inspired SVG code from the six writing-style
category scores.

## Syntax

```javascript
const svg = WriteLikeMe.generateStyleSVG(categories, width, height);
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `categories` | `object` | `{}` | Category weights from `0` to `1`; omitted categories default to `0.5` |
| `width` | `number` | `320` | SVG canvas width in pixels |
| `height` | `number` | `320` | SVG canvas height in pixels |

Supported category keys are `formality`, `complexity`, `sentence_length`,
`vocabulary`, `tone`, and `creativity`. A score of `0` is valid.

## Returns

A string containing a dark, square SVG. Its six horizontal bands correspond to
formality (F), complexity (C), sentence length (L), vocabulary (V), tone (T),
and creativity (R). Each band contains 54 circular cells: the score determines
how many are emphasized and their radius. The design is QR-inspired but is not
a scannable QR code. The “WriteLikeMe Code” label appears at the bottom left.

## Example

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const profile = WriteLikeMe.analyzeText('A sample sentence.');
const svg = WriteLikeMe.generateStyleSVG(profile);
fs.writeFileSync('writelikeme-code.svg', svg);
```

Category scores are expected to be numeric values from `0` through `1`.
