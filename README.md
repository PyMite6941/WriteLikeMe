# WriteLikeMe

**Writing Style Visualizer** - Generates SVG circles representing writing style characteristics with circle quantity and size showing the level of each category.

[![npm version](https://img.shields.io/npm/v/@ai-clyde/writelikeme)](https://www.npmjs.com/package/@ai-clyde/writelikeme)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/ai-clyde/WriteLikeMe)](https://github.com/ai-clyde/WriteLikeMe/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ai-clyde/WriteLikeMe)](https://github.com/ai-clyde/WriteLikeMe/network/members)

## 📦 Quick Start

### Installations

```bash
# 1. NPM (recommended - works with any AI model)
npm install @ai-clyde/writelikeme

# 2. Local path (for development/testing before publish)
npm link /path/to/writeLikeMe

# 3. Direct import from CDN (browser, no install needed)
# <script src="https://cdn.jsdelivr.net/npm/@ai-clyde/writelikeme/index.js"></script>

# 4. Git clone + require (for self-hosted environments)
# git clone https://github.com/ai-clyde/WriteLikeMe.git
# cd WriteLikeMe
# node -e "const W = require('./index.js')"
```

### Basic Usage (all methods)

```javascript
import WriteLikeMe from '@ai-clyde/writelikeme';
// Or: const WriteLikeMe = require('@ai-clyde/writelikeme');

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

## 🌐 Browser Integration (No NPM Required)

### Via CDN (Gemini, ChatGPT, Claude web interfaces)

```html
<!-- Add this script tag to your HTML -->
<script src="https://cdn.jsdelivr.net/npm/@ai-clyde/writelikeme/index.js"></script>

<script>
  // Analyze text
  const analysis = WriteLikeMe.analyzeText('Your writing style text here');
  console.log('Analysis:', analysis);
  
  // Generate SVG
  const svg = WriteLikeMe.generateStyleSVG(analysis);
  
  // Insert into page
  document.body.innerHTML = '<div>' + svg + '</div>';
</script>
```

### Via CDN - Modern Module Syntax

```html
<script type="module">
  import WriteLikeMe from 'https://cdn.jsdelivr.net/npm/@ai-clyde/writelikeme/index.js';
  
  const analysis = WriteLikeMe.analyzeText('Formal business proposal regarding quarterly results');
  const svg = WriteLikeMe.generateStyleSVG(analysis);
  document.body.innerHTML = svg;
</script>
```

## 💻 Command-Line Usage

### Local Node.js

```bash
# Install locally
npm link /home/pymite6941/services/local_storage/WriteLikeMe

# Run analysis
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

## 🤖 AI Model Integration

### Gemini (Google AI)

```javascript
// Can be used directly in Gemini extensions or scripts
const { WriteLikeMe } = require('@ai-clyde/writelikeme'); // If transpiled
// Or use via CDN in web interface

// Example: Analyze user prompt before processing
const analysis = WriteLikeMe.analyzeText(userPrompt);
console.log('Formality score:', analysis.formality);
```

### ChatGPT (OpenAI)

```javascript
// Works via CDN script tag in web pages
// Or as a Node.js tool for ChatGPT plugins

const analysis = WriteLikeMe.analyzeText('User message text');
const svg = WriteLikeMe.generateStyleSVG(analysis);
// SVG can be displayed or further processed
```

### Claude (Anthropic)

```javascript
// Pure JavaScript - works in any environment
// No model-specific integration needed

// Just import and use
const WriteLikeMe = require('@ai-clyde/writelikeme');
const result = WriteLikeMe.analyzeText(inputText);
```

### Custom AI Models

```javascript
// Any AI model that can execute JavaScript or Node.js
// Just require/import the package

const WriteLikeMe = require('@ai-clyde/writelikeme');
// Or use in browser: <script src="...">

// Functions are model-agnostic - they just analyze text and generate SVG
```

## 📖 Documentation

- [Guide (installation & quick start)](/guide/installation)
- [API Reference (analyze-text)](/api/analyze-text)
- [API Reference (generate-style-svg)](/api/generate-style-svg)
- [Examples (basic-usage)](/examples/basic-usage)
- [Examples (custom-categories)](/examples/custom-categories)

## 🚀 NPM

```bash
# After organization publish is complete:
npm install @ai-clyde/writelikeme

# Or for development (before org publish):
npm install @pymite6941/writelikeme  # personal scope
```

## 🐛 Bug Reports

[Open a GitHub Issue](https://github.com/ai-clyde/WriteLikeMe/issues)

## 🤝 Contributing

Pull requests are welcome. Please open an issue first to discuss what you'd like to change.

## 📄 License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2024 Clyde AI Project
