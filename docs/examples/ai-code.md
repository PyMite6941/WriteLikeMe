# Use with an AI-enabled application

WriteLikeMe is a JavaScript utility library, not a plugin for hosted AI chat
websites. Call it from an application you control—for example, before your
application sends text to an AI service.

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
```

## Browser applications

The published entry point is CommonJS and is not a standalone browser script.
Use a frontend build tool that bundles CommonJS dependencies. There is no
official browser bundle or direct CDN script integration at this time.

## Limitations

Analysis is local and does not call an AI model. The scores are experimental
heuristics based on text shape and small English keyword lists. Do not present
the results as reliable measures of a user's personality or writing ability.
See the [analyzeText API reference](/api/analyze-text) for current behavior.
