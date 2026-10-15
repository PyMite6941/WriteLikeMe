# Use with an AI-enabled application

WriteLikeMe includes a basic local writing algorithm and can also prepare style
guidance for an AI integration you control. It is not a plugin for hosted AI
chat websites.

## Offline writing

Generate a shareable style code from the user's sample. The profile metadata is
embedded in the SVG and can be used on another machine:

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');
const fs = require('fs');

const userSample = 'I think clear writing helps people understand a difficult idea.';
const prompt = 'Write a short paragraph about community gardens.';
const profile = WriteLikeMe.analyzeText(userSample);
const svg = WriteLikeMe.generateStyleSVG(profile);
fs.writeFileSync('writing-style.svg', svg);

const sharedProfile = WriteLikeMe.readStyleCode(
  fs.readFileSync('writing-style.svg', 'utf8')
);
const draft = WriteLikeMe.writeLikeMe(prompt, sharedProfile);
```

`writeLikeMe` is deterministic, uses local templates, and makes no network
requests. It can echo the prompt's topic and approximate measured style cues,
but it cannot follow complex instructions or reason like a language model.
Review its output before use.

## Node.js example

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');

function preparePrompt(userText) {
  const profile = WriteLikeMe.analyzeText(userText);

  return {
    text: userText,
    writingStyleProfile: profile
  };
}

function reviewDraft(userSample, generatedDraft) {
  return WriteLikeMe.compareTextStyle(userSample, generatedDraft);
}
```

Pass the prepared profile to your own AI integration as writing guidance. After
generation, `reviewDraft` compares the result with the original sample and
returns heuristic similarity and per-signal differences you can use to decide
whether to revise it. The package does not connect to an AI provider or
automatically revise AI output. An application may pass `analyzeText` results to
its own AI integration and use `compareTextStyle` to evaluate a returned draft.

## Browser applications

The published entry point is CommonJS and is not a standalone browser script.
Use a frontend build tool that bundles CommonJS dependencies. There is no
official browser bundle or direct CDN script integration at this time.

## Limitations

Analysis and the built-in template writer are local and do not call an AI model.
The scores are experimental heuristics based on text shape and small English
keyword lists. A shared SVG contains its profile metadata, including frequent
words, but never includes the full analyzed sample. Do not present the results
as reliable measures of a user's personality or writing ability.
See the [analyzeText API reference](/api/analyze-text) for current behavior.
