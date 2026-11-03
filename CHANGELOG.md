# Changelog

## 1.1.1

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
