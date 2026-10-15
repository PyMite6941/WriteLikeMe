# generateStyleSVG

Generate a compact, square, QR-inspired SVG code from seven writing-style
signals.

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
`vocabulary`, `tone`, `creativity`, and `punctuation`. A score of `0` is valid.

## Returns

A string containing a dark, square SVG. Its seven horizontal bands correspond to
formality (F), complexity (C), sentence length (L), vocabulary (V), tone (T),
creativity (R), and punctuation balance (P). The first six bands contain 54
circular cells each; score controls how many are emphasized and their radius.
The punctuation band uses 54 comma marks and period dots, with the comma share
controlled by the punctuation score. The design is QR-inspired but is not a
scannable QR code. The “WriteLikeMe Code” label appears at the bottom left.
The SVG also contains a versioned JSON profile in a `<metadata>` element. When
the input is an `analyzeText` result, this metadata includes its voice cues and
frequent words as well as the seven visible category scores. Review the metadata
before sharing: frequent words may reveal information about the source text.

Use `readStyleCode(svg)` to retrieve the profile. SVGs created before metadata
was added are read as an approximate seven-category profile.

## Example

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const profile = WriteLikeMe.analyzeText('A sample sentence.');
const svg = WriteLikeMe.generateStyleSVG(profile);
fs.writeFileSync('writelikeme-code.svg', svg);
```

Category scores are expected to be numeric values from `0` through `1`.
