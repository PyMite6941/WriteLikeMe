# Installation and quick start

WriteLikeMe is published on npm as
[`@ai-clyde/writelikeme`](https://www.npmjs.com/package/@ai-clyde/writelikeme).
It has **no runtime dependencies**, runs fully offline, and needs Node.js 14 or
newer (18+ recommended).

## Install

::: code-group

```bash [npm]
npm install @ai-clyde/writelikeme
```

```bash [pnpm]
pnpm add @ai-clyde/writelikeme
```

```bash [yarn]
yarn add @ai-clyde/writelikeme
```

```bash [bun]
bun add @ai-clyde/writelikeme
```

:::

Other ways to get it:

```bash
npx -y @ai-clyde/writelikeme --help           # run once, no install
npm install -g @ai-clyde/writelikeme          # global `writelike-me` command
npm install --save-dev @ai-clyde/writelikeme  # pin it for a project's agents/scripts
```

Check that it works:

```bash
npx writelike-me --version
```

Update with `npm update @ai-clyde/writelikeme` (or `npm i -g @ai-clyde/writelikeme@latest`).
Remove with `npm uninstall @ai-clyde/writelikeme`.

::: tip Using an AI coding agent?
See [AI harnesses](/api/harness-commands) for one-line MCP setup in Claude Code,
Cursor, Codex, Qwen Code, Gemini CLI, VS Code, Windsurf and OpenCode, plus prompts to
paste in.
:::

## Create your first SVG style code

From the command line:

```bash
npx writelike-me generate -f my-writing.md -o style/me.svg
npx writelike-me brief --style-code style/me.svg
```

`generate -o` writes the SVG (creating folders as needed). `brief` prints a short,
plain-language description of the style that you can paste into any AI chat.

From Node.js:

```javascript
const fs = require('fs');
const WriteLikeMe = require('@ai-clyde/writelikeme');

const analysis = WriteLikeMe.analyzeText(fs.readFileSync('my-writing.md', 'utf8'));
fs.writeFileSync('writelikeme-code.svg', WriteLikeMe.generateStyleSVG(analysis));
console.log(WriteLikeMe.describeStyle(analysis));
```

Or in the browser: use the [demo on the home page](/#quick-start), which can also
load an existing SVG and copy its style brief.

## Command line

```bash
writelike-me analyze  [text] [-f file]... [--brief]
writelike-me generate [text] [-f file]... [-o out.svg] [--width N] [--height N] [--no-words] [--context email]
writelike-me brief    --style-code me.svg
writelike-me inspect  me.svg [--brief]
writelike-me write    --style-code me.svg "Write a short paragraph about community gardens."
writelike-me check  --style-code me.svg [draft text | -f draft.md | -] [--min 0.8] [--json]
writelike-me compare  "reference text" "candidate text"
writelike-me mcp
```

| Command | What it does |
|---------|--------------|
| `analyze` | Prints style scores as JSON. `--brief` prints only categories, classification and the brief. |
| `generate` | Creates the SVG. Without `-o` it prints the markup; without text it uses the neutral default profile. `--no-words` leaves frequent words and signature phrases out of the SVG (privacy). |
| `brief` | Prints the style brief from an SVG (`--style-code`) or from text. |
| `inspect` | Prints the profile stored in an SVG's metadata. |
| `write` | Deterministic, template-based draft. Not a language model. |
| `check` | Scores a draft against an SVG style code and lists the largest style gaps with fixes. Exits non-zero when below `--min`. |
| `compare` | Heuristic style similarity (0–1) and per-signal differences. |
| `mcp` | Starts the MCP server for AI coding agents. |

Text can come from positional words, `-f/--file <path>` (repeatable; a directory
reads its `.md`, `.txt` and `.markdown` files non-recursively, sorted), or stdin
with `-` (`cat post.md | writelike-me analyze - --brief`). `generate --no-words`
leaves frequent words and signature phrases out of the SVG. In a checkout of this
repository, use `npm run analyze -- "text"`, `npm run generate -- -o me.svg "text"`, and so on.

## Imports

```javascript
// CommonJS
const WriteLikeMe = require('@ai-clyde/writelikeme');

// ES modules (Node.js imports the CommonJS default export)
import WriteLikeMe from '@ai-clyde/writelikeme';

// Agent Handler (also available as WriteLikeMe.Handler / WriteLikeMe.createHandler)
const { createHandler } = require('@ai-clyde/writelikeme/handler.js');
```

`index.js` is also a UMD script. In a plain web page, load it with
`<script src="https://unpkg.com/@ai-clyde/writelikeme/index.js"></script>` and use
`window.WriteLikeMe`. This is how the demo on this site runs.

## Schema v3: what's inside the SVG

The SVG `<metadata>` carries a complete, versioned JSON profile:

- **Seven categories**: formality, complexity, sentence_length, vocabulary,
  tone, creativity, punctuation
- **Voice cues**: pronouns, contractions, sentence variation, paragraph length,
  question/exclamation rates, transitions, hedging
- **Habit signals**: dialogue, all-caps, numbers, URLs, emoji, passive voice,
  punctuation rhythm, quote style
- **Grammar patterns**: comma splices, semicolon use, run-on sentences
- **Sentence structure**: simple / compound / complex rates
- **Readability**: Flesch-Kincaid grade, reading ease, grade label
- **Style classification**: formality level, dominant mood, voice, pacing
- **Domain**: business / technical / academic / creative / legal / medical / general
- **Frequent words**: up to five `{ word, count }` entries
- **Signature phrases**: up to five `{ phrase, count }` entries — repeated two-word sentence openers (optional, empty when none repeat)
- **Context**: optional `context` string (email / blog / docs ...) stored in the SVG metadata and used to name per-context style codes (`style/<context>.svg`)

v1 and v2 style codes are upgraded to v3 automatically when read.

The SVG contains the profile and frequent words, **not** the original sample. Still,
frequent words can reveal personal details, so inspect the file
(`writelike-me inspect me.svg`) before sharing it. To share style signals without
the words, generate with `generate --no-words` (CLI), `include_words: false`
(MCP `generate_style_svg`), or `{ includeWords: false }` (`generateStyleSVG` /
`createStyleProfile` in code); that empties `frequentWords` and
`signaturePhrases` in the embedded profile.

## Limitations

The analyzer uses dictionary and text-shape heuristics. It does not call an AI model
or evaluate meaning, and results on short or non-English text are rough. Punctuation
balance is not a grammar-correctness score. `writeLikeMe()` produces simple template
drafts; for real writing, give the style brief to an AI model.
