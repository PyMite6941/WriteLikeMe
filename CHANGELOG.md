# Changelog

## 1.2.0

- **New MCP prompts:** `write_like_me` (task, optional context) and `check_my_draft` (draft, optional context). Clients such as Claude Code list them as slash commands, e.g. `/mcp__writelikeme__write_like_me`.
- **New:** accuracy benchmark (`npm run bench`, also part of `npm test`): eight samples in clearly different styles, checked against the facts the style brief should report.
- **New:** `analyzeSamples(texts)` joins non-empty writing samples with blank lines, analyzes them with `analyzeText()`, and adds `sampleCount` to the result.
- **New CLI:** `-f/--file` may be repeated and may be a directory (reads `.md`, `.txt`, `.markdown` files, non-recursive, sorted); it works for `analyze`, `generate` and `brief`. New `generate --no-words` leaves frequent words and signature phrases out of the SVG.
- **New signature words:** `frequentWords` now excludes contractions (any apostrophe) and an extended stopword list of generic verbs/fillers. New optional `signaturePhrases` — up to five most common two-word sentence openers (count >= 2) as `[{ phrase, count }]` — is stored in profiles and SVG metadata, and `describeStyle()` adds a "Typical openers" line when present.
- **New MCP:** `analyze_text`, `generate_style_svg` and `describe_style` accept `text_paths` (array of file paths). `generate_style_svg` accepts `include_words` (default true). `generateStyleSVG` takes a fourth `options` argument (`{ includeWords: false }`), as does `createStyleProfile`, for the privacy flag.
- Website demo: "Leave out frequent words (privacy)" checkbox on the style preview/download/copy.
- **Draft checking:** `checkDraft(styleCode, draftText, options)` scores a draft against a profile (0-1), returns `pass` (score >= `options.min || 0.8`) and up to five largest style gaps with short actionable fixes (`{ signal, yours, draft, fix }`), covering sentence length, formality, complexity, contraction rate, first/second person, punctuation, question/exclamation rate, tone and more. CLI: `writelike-me check --style-code me.svg [draft | -f draft.md | -] [--min 0.8] [--json]` exits 1 when the score is below `--min` for CI. MCP: `check_draft` (draft or draft_path, style_code_path or svg, min).
- **Named contexts:** profiles may carry an optional `context` string (stored in SVG metadata, round-trips). CLI `generate --context email` sets it and, without `-o`, defaults output to `style/email.svg`; `describeStyle` prints "Context: email." as the first line. MCP `describe_style`, `check_draft` and `write_like_me` accept `context` (resolving `style/<context>.svg` when no style code is given), and `generate_style_svg` accepts `context` (default output_path `style/<context>.svg`).
- **Fix:** the MCP server no longer crashes on a message that is valid JSON but not
  a request object (`null`, a string, an array). It now replies with JSON-RPC
  `-32600 Invalid Request` and keeps running.
- **Fix:** `generate_style_svg` reports the file's real size in bytes.
- MCP tools report a missing file as `Could not read <path>: file not found`.
- New scripts: `npm run docs:dev` and `npm run docs:preview`.
- Tests: protocol edge cases, every tool's error path, relative paths, CLI edge
  cases, and a check that the published package contains every file it needs.
- CI: tests run on every push and pull request (Node 14–24, Linux, Windows, macOS).

## 1.1.0

- **New:** `writelike-me mcp`, a dependency-free MCP server for Claude Code, Cursor,
  Codex, Qwen Code, Gemini CLI, VS Code, Windsurf, OpenCode and other MCP clients.
  Tools: `generate_style_svg`, `describe_style`, `analyze_text`, `read_style_code`,
  `compare_styles`, `write_like_me`. They never return SVG markup to the model.
- **New:** `describeStyle()` and `writelike-me brief`: a ~100-token style brief for
  any AI model.
- **New CLI:** `generate -o`, `brief`, `inspect`, `write`, `compare`, `-f/--file`,
  stdin (`-`), `--flag=value`, `--version`.
- **New:** `Handler` / `createHandler` are also exported from the main entry.
- Website demo: download, copy and import SVG style codes; copy the style brief.
- v2 style codes are upgraded to v3 when read.
- **Fix:** contractions such as "that's" and "it's" are counted, and the contraction
  score uses a realistic scale, so briefs match contraction-heavy writing.
- **Fix:** "I'm", "I've", "you'll" and similar count as first/second person.
- **Fix:** local drafts capitalize every sentence and no longer repeat phrases.

## 1.0.3

- Punctuation style signal; first npm release under `@ai-clyde/writelikeme`.
