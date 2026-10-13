# WriteLikeMe

**Writing Style Visualizer** - Generates SVG circles representing writing style characteristics with circle quantity and size showing the level of each category.

[![npm version](https://img.shields.io/npm/v/@pymite6941/writelikeme)](https://www.npmjs.com/package/@pymite6941/writelikeme)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/pymite6941/WriteLikeMe)](https://github.com/pymite6941/WriteLikeMe/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/pymite6941/WriteLikeMe)](https://github.com/pymite6941/WriteLikeMe/network/members)

## 📦 Quick Start

```bash
# Install via npm
npm install @pymite6941/writelikeme

# Or use from local path
npm link /path/to/writeLikeMe
```

```javascript
import WriteLikeMe from '@pymite6941/writelikeme';

// Analyze text writing style
const analysis = WriteLikeMe.analyzeText('Your text here');
console.log(analysis);

// Generate SVG visualizer
const svg = WriteLikeMe.generateStyleSVG(analysis);
document.body.innerHTML = svg;
```

## 📋 API

### `analyzeText(text)`

Analyze a text string for writing style characteristics.

**Returns:**
- `formality` (0-1): How formal the text is
- `complexity` (0-1): Vocabulary complexity
- `sentence_length` (0-1): Average sentence length
- `vocabulary` (0-1): Vocabulary sophistication
- `tone` (0-1): Emotional tone
- `creativity` (0-1): Creativity level
- `confidence` (0-1): Analysis confidence
- `wordCount` (number): Total words
- `charCount` (number): Total characters

### `generateStyleSVG(categories, width, height)`

Generate an SVG visualizer with circles representing writing style levels.

**Returns:** SVG string markup

## 📖 Documentation

- [Guide](/guide/installation) - Installation and quick start
- [API Reference](/api/analyze-text) - analyzeText() documentation
- [API Reference](/api/generate-style-svg) - generateStyleSVG() function
- [Examples](/examples/basic-usage) - Basic usage examples

## 🚀 NPM

```bash
npm install @pymite6941/writelikeme
```

## 🐛 Bug Reports

[Open a GitHub Issue](https://github.com/pymite6941/WriteLikeMe/issues)

## 🤝 Contributing

Pull requests are welcome. Please open an issue first to discuss what you'd like to change.

## 📄 License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2024 Clyde AI Project
