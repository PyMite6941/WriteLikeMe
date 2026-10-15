# WriteLikeMe

**Writing Style Visualizer** - Analyzes writing locally, creates a shareable SVG style code with embedded JSON profile metadata, and can produce a simple style-guided draft without an AI service. The six circular bands encode broad scores, and a seventh punctuation band distinguishes commas from periods. The image is decorative, not a scannable QR code.

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
- `punctuation` (0-1): Comma share among commas and periods; 0.5 when neither appears
- Voice cues: perspective pronouns, contraction use, sentence variation, paragraph length, question/exclamation rate, transitions, and hedging
- `frequentWords`: Up to five most frequent content words from the sample
- `confidence` (0-1): Word count divided by 200, capped at 1; not statistical confidence
- `wordCount`: Unicode letter/number token count
- `charCount`: Trimmed UTF-16 code-unit count
- Punctuation counts and rates for commas, periods, semicolons, colons, dashes, questions, and exclamations

Use `compareTextStyle(referenceText, candidateText)` to score a draft against a
user's sample. It returns a 0-1 heuristic similarity and per-signal differences,
including overlap in frequent words. The comparison measures style cues rather
than meaning and cannot guarantee an exact voice match.

The punctuation signal describes comma-versus-period habits, not grammatical
correctness. The generated SVG represents commas and periods with different
marks. Its visible pattern shows seven categories, while embedded, versioned
JSON stores the full analyzed profile, including voice cues and frequent words.
Frequent words can reveal personal information; inspect the profile before
sharing a style code.

### `readStyleCode(svg)` and `writeLikeMe(prompt, styleCode)`

Read the embedded profile from a WriteLikeMe SVG and create a deterministic,
local draft guided by its style signals:

```javascript
const profile = WriteLikeMe.readStyleCode(svg);
const draft = WriteLikeMe.writeLikeMe(
  'Write a short paragraph about community gardens.',
  profile
);
```

This built-in writer uses templates and the prompt text. It makes no network
requests and needs no API key, but it cannot reason about facts or reliably
follow complex instructions like an AI language model. Its output is a simple
starting point, not an exact imitation of the author.

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

The installed `writelike-me` command analyzes text, creates a shareable style
code, or writes a local style-guided draft:

```bash
# Analyze text and print the scores as JSON
writelike-me analyze "A sample paragraph to analyze."

# Generate a style SVG from text
writelike-me generate "A sample paragraph to visualize." > writelikeme-code.svg

# Generate an SVG with the default style profile
writelike-me generate > writelikeme-code.svg

# Write a draft locally using a shared style code
writelike-me write --style-code writelikeme-code.svg "Write a short paragraph about community gardens."
```

Run the same commands from a local checkout with `npm run analyze -- "text"` or
`npm run generate -- "text"`. Use `npm run write -- --style-code file.svg "prompt"`
for local writing. `npm run generate` creates an SVG with the default profile.
Install globally to use the command system-wide:

```bash
npm install -g /path/to/writeLikeMe

# Or after publish to npm:
npm install -g @ai-clyde/writelikeme
```

For programmatic use, import the package from Node.js as shown in [Basic Usage](#basic-usage-all-methods).

## 🤖 Use with an AI-enabled application

The local `writeLikeMe` algorithm does not call an AI model. For AI-generated
drafts, pass the profile from `analyzeText` to your own provider integration,
then use `compareTextStyle` to review the result. The package does not connect
to an external AI provider or transmit text.

## 📖 Documentation

- [Guide (installation & quick start)](https://pymite6941.github.io/WriteLikeMe/guide/installation)
- [API Reference (analyze-text)](https://pymite6941.github.io/WriteLikeMe/api/analyze-text)
- [API Reference (generate-style-svg)](https://pymite6941.github.io/WriteLikeMe/api/generate-style-svg)
- [API Reference (style code and local writing)](https://pymite6941.github.io/WriteLikeMe/api/style-code)
- [Examples (basic-usage)](https://pymite6941.github.io/WriteLikeMe/examples/basic-usage)
- [Examples (custom-categories)](https://pymite6941.github.io/WriteLikeMe/examples/custom-categories)

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
