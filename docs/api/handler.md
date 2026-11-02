# Handler — connection-based interface for agents

The `WriteLikeMeHandler` class wraps the local WriteLikeMe library so an agent
(or any consumer) can **connect** to a style profile, analyze text, generate
shareable SVG style codes, write local drafts, and exchange profiles with other
agents. It makes no network requests and requires no API key.

```javascript
const { Handler, createHandler } = require('@ai-clyde/writelikeme');
const handler = createHandler();
// or: const { createHandler } = require('@ai-clyde/writelikeme/handler.js');
```

For AI coding agents (Claude Code, Cursor, Codex…), the MCP server is usually the
easier route: see [AI harnesses](/api/harness-commands).

## Connecting to a profile

```javascript
// From a profile object
handler.connect({
  categories: { formality: 0.8, creativity: 0.9 },
  signals: { first_person: 0.4, contraction_rate: 0.6 }
});

// From a WriteLikeMe SVG string (the metadata carries the full profile)
handler.connect(svg);

// From a local SVG file (Node.js only)
handler.connectFromFile('./style.svg');
```

`connect()` accepts an SVG string, a profile object, or (in Node) a path to an
SVG file (an unreadable path throws). It returns a snapshot of the handler state. Use `isConnected()` to
check whether a profile is loaded, and `snapshot()` to inspect current state at
any time.

## Analyzing text

```javascript
const analysis = handler.analyze('A short sample paragraph.');
console.log(analysis.formality, analysis.tone, analysis.wordCount);
```

Delegates to `WriteLikeMe.analyzeText`. Returns bounded scores (0–1) for the
seven categories plus voice cues (pronouns, contractions, transitions, hedging,
questions, exclamations), punctuation counts, frequent words, confidence, and
the following expanded signals:

- **Grammar mistakes** (schema v3): `comma_splice_rate`, `semicolon_spam_rate`, `run_on_sentence_rate`
- **Sentence structure**: `simple_sentence_rate`, `compound_sentence_rate`, `complex_sentence_rate`
- **Writing habits**: `dialogue_rate`, `all_caps_rate`, `number_rate`, `url_rate`, `emoji_rate`, `passive_rate`, `punctuation_rhythm`, `quote_style`
- **Readability**: `flesch_kincaid_grade`, `flesch_reading_ease`, `grade_label` (elementary/middle-school/high-school/college/graduate)
- **Style classification**: `formality_level`, `dominant_mood`, `voice`, `pacing`, `grade_label`
- **Domain**: detected topic area (business, technical, academic, creative, legal, medical, or general)

Structured breakdowns are also returned: `punctuationBreakdown`, `vocabularyBreakdown`, `readability`, `styleClassification`.

## Generating a shareable SVG

```javascript
const svg = handler.generateSVG();
// or with overrides
const svg = handler.generateSVG({ formality: 0.9 }, 600, 400);
```

It embeds the whole connected profile (signals and frequent words included);
category overrides passed as the first argument are merged on top. The SVG embeds the
complete, versioned JSON profile in its `<metadata>` element, so the file itself
is the portable shareable unit — any agent with `readStyleCode` can recover the
full profile.

## Writing a local draft

```javascript
const draft = handler.write('Write a short paragraph about community gardens.');
```

Uses the connected profile's style signals to produce a deterministic,
template-based draft. Throws if the handler is not connected or the prompt is
empty.

## Comparing styles

```javascript
const result = handler.compare(referenceText, candidateText);
console.log(result.similarity); // 0-1 heuristic style similarity
console.log(result.differences);  // per-signal differences
```

## Sharing a profile with another agent

`share()` exports a portable, versioned profile that another agent can `import()`:

```javascript
// Agent A
const shared = handlerA.share();
// { format: 'writelikeme-profile', version: 1, profile: {...}, ... }

// Agent B
handlerB.import(shared);
```

Profiles can also be persisted to JSON files:

```javascript
handlerA.exportToFile('./profile.json');
handlerB.importFromFile('./profile.json');
```

## API reference

| Method | Purpose |
|--------|---------|
| `connect(styleCode)` | Load a profile from SVG string, object, or SVG file path |
| `connectFromFile(filePath)` | Read an SVG file and connect to its profile |
| `isConnected()` | Whether a profile is currently loaded |
| `snapshot()` | Return the current handler state (profile, source, connected) |
| `analyze(text)` | Analyze text style (delegates to `analyzeText`) |
| `generateSVG(cats, width, height)` | Generate an SVG style code from categories |
| `write(prompt)` | Write a local draft guided by the connected profile |
| `compare(referenceText, candidateText)` | Heuristic style similarity between two texts |
| `share()` | Export a portable profile for another agent |
| `import(sharedProfile)` | Import a profile shared by another agent |
| `exportToFile(filePath)` | Save the shared profile to a JSON file |
| `importFromFile(filePath)` | Load a shared profile from a JSON file |
| `reset()` | Clear the loaded profile |

## Important notes

- The local writer is template-based, not a language model. It cannot reason
  about facts or reliably follow complex instructions.
- The SVG metadata includes up to five frequent words from the analyzed sample.
  Inspect the profile before sharing a style code, as frequent words can reveal
  personal information.
- Scores are rounded to two decimals by design (`roundScore`). SVG round-trips
  preserve scores within that precision.
