# Style code and local writing

WriteLikeMe SVGs include a versioned JSON profile in their `<metadata>` element.
This lets the style code be shared as a file and read back into the package.
The current schema is v3, which carries the seven visible categories plus voice
cues, habit signals, grammar mistake signals, sentence-structure signals,
readability metrics, style classification, domain detection, and frequent words.
v1 and v2 style codes are automatically upgraded to v3 when read.

## Read a profile from an SVG

```javascript
const profile = WriteLikeMe.readStyleCode(svg);
```

`readStyleCode(svg)` returns an object with `schemaVersion`, the seven visible
`categories`, additional `signals`, `frequentWords`, and available count
`stats`. For SVGs created before profile metadata was added, it estimates the
seven category scores from the visible marks; other signal values are not
recoverable.

## Get a style brief for an AI model

```javascript
const brief = WriteLikeMe.describeStyle(profile); // or describeStyle(svgString)
```

`describeStyle` returns about seven short lines (register, sentences, voice,
habits, punctuation, reading level, signature words), roughly 100 tokens. Paste
it into a prompt so a language model writes in that voice; this works far better
than the template writer below. The CLI equivalent is
`writelike-me brief --style-code me.svg`, and the MCP tool is `describe_style`
(see [AI harnesses](/api/harness-commands)).

Example output:

```text
Register: casual and conversational; warm, positive tone.
Sentences: short, with varied lengths; simple structure and everyday words.
Voice: speak in first person (I/we); use contractions.
Habits: ask the reader questions; use exclamation marks.
Punctuation: balanced commas and full stops.
Signature words: honestly, ship, team.
```

## Write locally from a prompt

```javascript
const draft = WriteLikeMe.writeLikeMe(
  'Write a short paragraph about community gardens.',
  profile
);
```

`writeLikeMe(prompt, styleCode)` accepts a profile object or a WriteLikeMe SVG
string and returns a deterministic, template-based draft. The optional
`styleCode` defaults to a neutral profile. The local writer uses the prompt
topic and measured style cues; it makes no network requests and requires no API
key. It does not have language-model reasoning, cannot reliably follow complex
instructions, and should be treated as a basic writing aid rather than an
exact imitation.

The CLI accepts the same SVG profile:

```bash
writelike-me write --style-code style.svg "Write a short paragraph about community gardens."
```

The SVG metadata contains profile scores and up to five frequent words, not the
original writing sample. Frequent words can still reveal personal information,
so inspect the profile before sharing it. AI providers do not automatically
read SVG metadata; an application that uses an external model must call
`readStyleCode` and pass the resulting JSON as explicit context.
