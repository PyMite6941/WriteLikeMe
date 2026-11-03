# WriteLikeMe

**Writing Style Visualizer** - Analyzes writing locally, creates a shareable SVG style code with embedded JSON profile metadata, and can produce a simple style-guided draft without an AI service. A square, QR-inspired pattern encodes seven writing signals, and `describeStyle` turns the profile into a short brief any AI model can follow. The image is decorative, not a scannable QR code.

[![npm version](https://img.shields.io/npm/v/@ai-clyde/writelikeme)](https://www.npmjs.com/package/@ai-clyde/writelikeme)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/PyMite6941/WriteLikeMe)](https://github.com/PyMite6941/WriteLikeMe/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/PyMite6941/WriteLikeMe)](https://github.com/PyMite6941/WriteLikeMe/network/members)

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

`index.js` is a UMD script with no dependencies. Bundle it with any frontend build
tool, or load it directly and use `window.WriteLikeMe`:

```html
<script src="https://unpkg.com/@ai-clyde/writelikeme/index.js"></script>
```

The [website demo](https://pymite6941.github.io/WriteLikeMe/#quick-start) runs this
way: it analyzes text in the browser, downloads or copies the SVG, loads an existing
SVG style code, and copies a style brief for AI tools.

## 💻 Command-Line Usage

```bash
npx -y @ai-clyde/writelikeme --help          # no install needed
npm install -g @ai-clyde/writelikeme         # or install the `writelike-me` command

writelike-me generate -f my-writing.md -o style/me.svg   # create the SVG style code
writelike-me brief --style-code style/me.svg             # ~100-token style brief for any AI
writelike-me analyze -f my-writing.md --brief            # compact scores (drop --brief for full JSON)
writelike-me inspect style/me.svg --brief                # profile stored in an SVG
writelike-me compare "reference text" "candidate text"   # heuristic similarity
writelike-me write --style-code style/me.svg "Write about community gardens."
writelike-me mcp                                         # MCP server for AI agents
```

Text comes from positional words, `-f <file>`, or `-` for stdin. Without `-o`,
`generate` prints the SVG markup. In a checkout, use `npm run generate -- -o me.svg "text"` etc.

## 🤖 AI harnesses (Claude Code, Cursor, Codex, Qwen Code, Gemini CLI…)

WriteLikeMe includes a dependency-free MCP server. Register it once:

```bash
claude mcp add writelikeme -- npx -y @ai-clyde/writelikeme mcp      # Claude Code
codex mcp add writelikeme -- npx -y @ai-clyde/writelikeme mcp       # OpenAI Codex CLI
qwen mcp add writelikeme npx -y @ai-clyde/writelikeme mcp           # Qwen Code
gemini mcp add writelikeme npx -y @ai-clyde/writelikeme mcp         # Gemini CLI
```

For Cursor, add to `.cursor/mcp.json`:

```json
{ "mcpServers": { "writelikeme": { "command": "npx", "args": ["-y", "@ai-clyde/writelikeme", "mcp"] } } }
```

Then paste into the agent:

```text
Call writelikeme describe_style with style_code_path "style/me.svg", then write
<WHAT YOU WANT> following that brief.
```

Tools: `generate_style_svg`, `describe_style`, `analyze_text`, `read_style_code`,
`compare_styles`, `write_like_me`. They return compact text and never paste SVG
markup into the context. The [AI harness guide](https://pymite6941.github.io/WriteLikeMe/api/harness-commands)
covers VS Code, Windsurf and OpenCode, the Windows `cmd /c` form, slash commands,
`AGENTS.md`/`CLAUDE.md` snippets and more prompts.

## 🤝 Handler — connection-based interface for agents

The `WriteLikeMeHandler` class wraps the library so any agent can connect to a
style profile, analyze text, generate shareable SVG style codes, write local
drafts, and exchange profiles with other agents. No network calls are made.

```javascript
const { Handler, createHandler } = require('@ai-clyde/writelikeme');
const handler = createHandler();

// Connect to a profile (SVG string, profile object, or SVG file path)
handler.connect(svg);

// Analyze text
const analysis = handler.analyze('A short sample paragraph.');

// Generate a shareable SVG (full profile embedded in metadata)
const svg = handler.generateSVG();

// Write a local draft guided by the connected profile
const draft = handler.write('Write about clear writing.');

// Share the profile with another agent
const shared = handler.share();
// agentB.import(shared);
```

Key methods:

| Method | Purpose |
|--------|---------|
| `connect(styleCode)` | Load a profile from SVG string, object, or SVG file path |
| `connectFromFile(filePath)` | Read an SVG file and connect to its profile |
| `isConnected()` | Whether a profile is loaded |
| `snapshot()` | Return current handler state |
| `analyze(text)` | Analyze text style |
| `generateSVG(cats, width, height)` | Generate an SVG style code |
| `write(prompt)` | Write a draft guided by the connected profile |
| `compare(ref, cand)` | Heuristic style similarity between two texts |
| `share()` | Export a portable profile for another agent |
| `import(sharedProfile)` | Import a profile shared by another agent |
| `exportToFile(filePath)` | Save the shared profile to JSON |
| `importFromFile(filePath)` | Load a shared profile from JSON |
| `reset()` | Clear the loaded profile |

See the [Handler API reference](https://pymite6941.github.io/WriteLikeMe/api/handler)
for full details.

## 🧠 Style brief for any model

`describeStyle(profileOrSvg)` turns a profile into a short plain-language brief
(register, sentences, voice, habits, punctuation, signature words). Give it to any
LLM so it writes in that voice, then check the result with `compareTextStyle`.
WriteLikeMe itself never calls an AI provider or sends text anywhere.

## 📖 Documentation

- [Guide (installation & quick start)](https://pymite6941.github.io/WriteLikeMe/guide/installation)
- [AI harnesses (MCP setup and prompts)](https://pymite6941.github.io/WriteLikeMe/api/harness-commands)
- [Handler API](https://pymite6941.github.io/WriteLikeMe/api/handler)
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

```bash
npm test             # library, Handler, CLI, MCP server (real stdio session), package contents
npm run docs:dev     # docs site with the live demo at http://localhost:5173/WriteLikeMe/
npm run docs:build
```

CI runs `npm test` on Node 14–24 (Linux, Windows, macOS) for every push and pull request.
To release, bump `version` in `package.json` and add a [CHANGELOG](CHANGELOG.md) entry;
merging to `main` publishes the new version to npm.

## 📄 License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2024 Clyde AI Project
