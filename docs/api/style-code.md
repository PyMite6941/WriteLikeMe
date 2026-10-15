# Style code and local writing

WriteLikeMe SVGs include a versioned JSON profile in their `<metadata>` element.
This lets the style code be shared as a file and read back into the package.

## Read a profile from an SVG

```javascript
const profile = WriteLikeMe.readStyleCode(svg);
```

`readStyleCode(svg)` returns an object with `schemaVersion`, the seven visible
`categories`, additional `signals`, `frequentWords`, and available count
`stats`. For SVGs created before profile metadata was added, it estimates the
seven category scores from the visible marks; other signal values are not
recoverable.

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
