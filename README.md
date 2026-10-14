# WriteLikeMe

**Writing Style Visualizer** - Generates a compact, dark, QR-inspired SVG code. Six bands of circles encode category scores through circle count and size; it is decorative, not a scannable QR code.

[![npm version](https://img.shields.io/npm/v/@ai-clyde/writelikeme)](https://www.npmjs.com/package/@ai-clyde/writelikeme)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/ai-clyde/WriteLikeMe)](https://github.com/PyMite6941/WriteLikeMe/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ai-clyde/WriteLikeMe)](https://github.com/PyMite6941/WriteLikeMe/network/members)

## 📦 Quick Start

### Install

```bash
npm install @ai-clyde/writelikeme
```

### Basic Usage (all methods)

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');

const analysis = WriteLikeMe.analyzeText('A short sample paragraph.');
console.log(analysis);

const svg = WriteLikeMe.generateStyleSVG(analysis);
require('fs').writeFileSync('writelikeme-code.svg', svg);
```

## 📋 API

### `analyzeText(text)`

Analyze a text string for writing style characteristics.

**Returns:**
- `formality` (0-1): A ratio based on a small formal/casual keyword list
- `complexity` (0-1): Average word length and long-word proportion
- `sentence_length` (0-1): Average words per sentence, normalized to 30
- `vocabulary` (0-1): Unique-token count adjusted by text length
- `tone` (0-1): Ratio of words in small positive/negative keyword lists
- `creativity` (0-1): Vocabulary variety, imagery words, and punctuation variety
- `confidence` (0-1): Word count divided by 200, capped at 1; not statistical confidence
- `wordCount`: Unicode letter/number token count
- `charCount`: Trimmed UTF-16 code-unit count

The heuristics and keyword lists are experimental, English-focused, and can be
inaccurate. They do not account for context, negation, or sarcasm and must not
be treated as reliable linguistic or psychological measurements.

### `generateStyleSVG(categories, width, height)`

Generate a compact, QR-inspired SVG code representing writing style scores.

**Returns:** SVG string markup

## 🌐 Browser Applications

The published package is CommonJS. Use a frontend build tool that supports
CommonJS dependencies. Direct CDN `<script>` use and injection into hosted
Gemini, ChatGPT, or Claude pages are not supported. The Pages site itself has a
browser demo that generates a score profile, JavaScript sample, and SVG locally.

## 💻 Command-Line Usage

### Local Node.js

```bash
# Run analysis after installing the package
node -e "const W = require('@ai-clyde/writelikeme'); console.log(W.analyzeText('formal text'))"

# Generate SVG
node -e "const W = require('@ai-clyde/writelikeme'); console.log(W.generateStyleSVG({formality: 0.8}))"
```

### Global Install (system-wide)

```bash
# Install globally (then use writelikeme command)
npm install -g /path/to/writeLikeMe

# Or after publish to npm:
npm install -g @ai-clyde/writelikeme
```

## 🤖 Use with an AI-enabled application

Call WriteLikeMe in an application you control before sending text to your
chosen AI service. The package analyzes locally and does not call an AI model.

## 📖 Documentation

- [Guide (installation & quick start)](https://pymite6941.is-a.dev/WriteLikeMe/guide/installation)
- [API Reference (analyze-text)](https://pymite6941.is-a.dev/WriteLikeMe/api/analyze-text)
- [API Reference (generate-style-svg)](https://pymite6941.is-a.dev/WriteLikeMe/api/generate-style-svg)
- [Examples (basic-usage)](https://pymite6941.is-a.dev/WriteLikeMe/examples/basic-usage)
- [Examples (custom-categories)](https://pymite6941.is-a.dev/WriteLikeMe/examples/custom-categories)

## 🚀 NPM

```bash
npm install @ai-clyde/writelikeme
```

## 🐛 Bug Reports

[Open a GitHub Issue](https://github.com/PyMite6941/WriteLikeMe/issues)

## 🤝 Contributing

Pull requests are welcome. Please open an issue first to discuss what you'd like to change.

## 📄 License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2024 Clyde AI Project
