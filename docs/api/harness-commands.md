# AI harnesses (Claude Code, Cursor, Codex, Qwen Code…)

WriteLikeMe ships a built-in **MCP server** (`writelike-me mcp`) and a CLI, so
any coding agent can turn your writing into an SVG style code and then write in
your voice. Everything runs locally; no API key, no network calls after install.

**The workflow:**

1. Create a style code once: your writing sample → `style/me.svg`.
2. Whenever the agent writes prose for you, it reads a ~100-token **style brief**
   from that SVG and follows it.
3. Optionally, it checks its draft with `compare_styles` and revises.

::: tip Token use
The tools never return SVG markup to the model. `generate_style_svg` writes the
file and returns only its path and the brief; `describe_style` returns about
seven short lines. On the CLI, always use `-o file.svg` and `--brief`.
:::

## 1. One-time setup in a terminal (outside the TUI)

Requires Node.js 14+ (18+ recommended). `npx -y` downloads the package on first
use, so no install is needed. To pin a version for a project instead:

```bash
npm install --save-dev @ai-clyde/writelikeme   # then use: npx writelike-me ...
```

Create your style code from any text, Markdown or email export you wrote:

```bash
npx -y @ai-clyde/writelikeme generate -f my-writing.md -o style/me.svg
npx -y @ai-clyde/writelikeme brief --style-code style/me.svg
```

Use a few hundred words or more; short samples give weak signals. You can also
make the SVG on the [website demo](/#quick-start) and save it as `style/me.svg`.

Then register the MCP server with your harness below.

## 2. Register the MCP server

All harnesses run the same command: `npx -y @ai-clyde/writelikeme mcp`.

::: warning Windows
If a client reports that it can't start `npx`, wrap it with `cmd /c`:
`"command": "cmd", "args": ["/c", "npx", "-y", "@ai-clyde/writelikeme", "mcp"]`.
For Claude Code: `claude mcp add writelikeme -- cmd /c npx -y @ai-clyde/writelikeme mcp`.
:::

### Claude Code

Terminal:

```bash
claude mcp add writelikeme -- npx -y @ai-clyde/writelikeme mcp
# everywhere, not just this project:
claude mcp add --scope user writelikeme -- npx -y @ai-clyde/writelikeme mcp
# shared with your team via .mcp.json in the repo:
claude mcp add --scope project writelikeme -- npx -y @ai-clyde/writelikeme mcp
```

Inside Claude Code:

```text
/mcp
```

shows `writelikeme` as connected. To run the CLI without leaving the session,
prefix it with `!`:

```text
! npx -y @ai-clyde/writelikeme brief --style-code style/me.svg
```

**Optional slash command.** Save as `.claude/commands/write-like-me.md`, then use
`/write-like-me a LinkedIn post about our launch`:

```markdown
---
description: Write in my style using my WriteLikeMe style code
argument-hint: <what to write>
allowed-tools: Bash(npx -y @ai-clyde/writelikeme:*)
---
My style brief:
!`npx -y @ai-clyde/writelikeme brief --style-code style/me.svg`

Write the following in that style. Match the voice, not the topic: $ARGUMENTS
```

### Cursor

Create `.cursor/mcp.json` in the project, or `~/.cursor/mcp.json` for all projects:

```json
{
  "mcpServers": {
    "writelikeme": {
      "command": "npx",
      "args": ["-y", "@ai-clyde/writelikeme", "mcp"]
    }
  }
}
```

Enable it under **Cursor Settings → MCP** (Tools & Integrations); a green dot means
it's running. The Cursor CLI (`cursor-agent`) reads the same file;
`cursor-agent mcp list` confirms it.

Optional always-on rule, `.cursor/rules/writelikeme.mdc`:

```markdown
---
description: Use my writing style for prose
alwaysApply: false
---
When writing prose for me (docs, emails, posts, release notes), call the
writelikeme `describe_style` tool with style_code_path `style/me.svg` and follow the brief.
```

### OpenAI Codex CLI

Terminal:

```bash
codex mcp add writelikeme -- npx -y @ai-clyde/writelikeme mcp
```

Or add it to `~/.codex/config.toml` yourself:

```toml
[mcp_servers.writelikeme]
command = "npx"
args = ["-y", "@ai-clyde/writelikeme", "mcp"]
```

Inside Codex, `/mcp` lists the server and its tools. Put the project
instruction (section 4) in `AGENTS.md`.

### Qwen Code

Terminal:

```bash
qwen mcp add writelikeme npx -y @ai-clyde/writelikeme mcp                  # user settings
qwen mcp add --scope project writelikeme npx -y @ai-clyde/writelikeme mcp  # this project only
```

Or edit `.qwen/settings.json` (project) or `~/.qwen/settings.json` (user):

```json
{
  "mcpServers": {
    "writelikeme": {
      "command": "npx",
      "args": ["-y", "@ai-clyde/writelikeme", "mcp"]
    }
  }
}
```

Inside Qwen Code, `/mcp` shows the tools, and `!` runs shell commands
(`! npx -y @ai-clyde/writelikeme brief --style-code style/me.svg`). Put the
project instruction in `QWEN.md`.

### Gemini CLI

```bash
gemini mcp add writelikeme npx -y @ai-clyde/writelikeme mcp
```

Same `mcpServers` JSON as Qwen Code, in `.gemini/settings.json`. Use `/mcp` inside
(or `gemini mcp list` in a terminal), and put the project instruction in `GEMINI.md`.
Gemini CLI must be signed in or have `GEMINI_API_KEY` set before `gemini mcp`
commands run.

### VS Code (GitHub Copilot agent mode)

`.vscode/mcp.json`:

```json
{
  "servers": {
    "writelikeme": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@ai-clyde/writelikeme", "mcp"]
    }
  }
}
```

Click **Start** above the server entry, then pick the tools in Copilot Chat's tool menu (agent mode).

### Windsurf

`~/.codeium/windsurf/mcp_config.json`, same `mcpServers` JSON as Cursor. Refresh in
**Windsurf Settings → Cascade → MCP servers**.

### OpenCode

`opencode.json` in the project:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "writelikeme": {
      "type": "local",
      "command": ["npx", "-y", "@ai-clyde/writelikeme", "mcp"],
      "enabled": true
    }
  }
}
```

### Any other MCP client (Cline, Roo Code, Zed, Claude Desktop…)

Use the standard stdio entry: command `npx`, args
`["-y", "@ai-clyde/writelikeme", "mcp"]`. If the client has no MCP support, use the CLI
(section 5).

## 3. Prompts to paste into the harness

These work in any harness once the MCP server is connected.

**Create my style code**

```text
Use the writelikeme generate_style_svg tool with text_path "my-writing.md" and
output_path "style/me.svg". Show me the returned brief only.
```

**Write like me**

```text
Call writelikeme describe_style with style_code_path "style/me.svg", then write
<WHAT YOU WANT> following that brief. Match my voice, not my topics.
```

**Write, check and revise once**

```text
Write <WHAT YOU WANT> in my style (writelikeme describe_style, style_code_path
"style/me.svg"). Then run compare_styles with reference_path "my-writing.md" and
your draft as candidate. If similarity is below 0.85, revise once using the
largestDifferences, and tell me the final score.
```

**Restyle existing text**

```text
Rewrite docs/announcement.md in my style using writelikeme describe_style
(style_code_path "style/me.svg"). Keep every fact and link; change only the voice.
```

**No MCP? Use the CLI from the agent**

```text
Run `npx -y @ai-clyde/writelikeme brief --style-code style/me.svg` and follow that
brief to write <WHAT YOU WANT>. Don't print the SVG file.
```

Aider has no MCP, but `/run` adds command output to the chat:

```text
/run npx -y @ai-clyde/writelikeme brief --style-code style/me.svg
```

## 4. Project instruction (CLAUDE.md, AGENTS.md, QWEN.md, GEMINI.md)

Add this so the agent applies your style without being asked each time:

```markdown
## Writing style
When writing prose for me (docs, READMEs, emails, posts, release notes), first get my
style brief: the writelikeme MCP `describe_style` tool with style_code_path
`style/me.svg`, or `npx -y @ai-clyde/writelikeme brief --style-code style/me.svg`.
Follow it. Never paste the SVG contents into the conversation. This does not apply to
code or code comments.
```

## 5. CLI reference

```bash
writelike-me analyze  [text] [-f file] [--brief]       # style scores (JSON)
writelike-me generate [text] [-f file] [-o out.svg] [--width N] [--height N]
writelike-me brief    --style-code me.svg              # ~100-token style brief
writelike-me inspect  me.svg [--brief]                 # profile stored in an SVG
writelike-me write    --style-code me.svg "prompt"     # template draft, no AI
writelike-me compare  "reference" "candidate" [--brief]
writelike-me compare  --reference-file a.md --candidate-file b.md
writelike-me mcp                                       # MCP server over stdio
writelike-me --version
```

Use `-` as the text to read stdin: `cat notes.md | writelike-me analyze - --brief`.
Without `-o`, `generate` prints the SVG to stdout. Run any of these with
`npx -y @ai-clyde/writelikeme <command>` if the package isn't installed.

## MCP tools

| Tool | Arguments | Returns |
|------|-----------|---------|
| `generate_style_svg` | `text` or `text_path`, `output_path`, `width`, `height` | file path, size, brief |
| `describe_style` | `style_code_path`, `svg` or `text` | style brief (plain text) |
| `analyze_text` | `text` or `text_path`, `full` | compact summary (full JSON if `full`) |
| `read_style_code` | `style_code_path` or `svg`, `full` | compact summary of an SVG's profile |
| `compare_styles` | `reference`/`reference_path`, `candidate`/`candidate_path` | similarity + 6 largest differences |
| `write_like_me` | `prompt`, `style_code_path` or `svg` | template-based local draft |

Relative paths resolve against the directory the harness starts the server in
(normally the project root).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Server shows as failed or disconnected | Run `npx -y @ai-clyde/writelikeme --version` in a terminal. If that fails, install Node.js 18+ and check that `npx` is on the PATH the harness sees. |
| `spawn npx ENOENT` on Windows | Use the `cmd /c` form above. |
| `Could not read …/style/me.svg` | Paths are relative to the server's working directory. Use an absolute path or open the harness in the project root. |
| `Unsupported or invalid … version` | The SVG wasn't made by WriteLikeMe, or was edited. Regenerate it. |
| Slow first start | `npx` downloads the package once. Pin it with `npm i -D @ai-clyde/writelikeme` and use `"command": "node", "args": ["node_modules/@ai-clyde/writelikeme/cli.js", "mcp"]`. |

Verify a checkout of this repository with `npm test`, which covers the library,
Handler, CLI and an end-to-end MCP session.
