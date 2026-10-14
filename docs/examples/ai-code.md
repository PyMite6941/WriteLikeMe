# AI Code Integration

WriteLikeMe can be used with any AI model (Gemini, ChatGPT, Claude, etc.) to analyze writing style before code generation or processing.

## Use Case: AI-Powered Code Style Analysis

Many AI coding assistants can benefit from understanding the writing style of user prompts or documentation. WriteLikeMe provides a model-agnostic way to analyze text and generate visual SVG representations.

### Integration Pattern

```javascript
// Any AI model can use WriteLikeMe - it's pure JavaScript
const WriteLikeMe = require('@ai-clyde/writelikeme');

// Analyze user input before sending to AI
const analysis = WriteLikeMe.analyzeText(userPrompt);
console.log('Formality:', analysis.formality);
console.log('Complexity:', analysis.complexity);

// Generate SVG visualization
const svg = WriteLikeMe.generateStyleSVG(analysis);
// Insert into page or send to AI as context
```

## AI Model Integration Examples

### With Gemini (Google AI)
```javascript
// Gemini can execute JavaScript directly
const { WriteLikeMe } = require('@ai-clyde/writelikeme');
const analysis = WriteLikeMe.analyzeText(userPrompt);
// Pass analysis.formality, analysis.creativity etc. as context to Gemini
```

### With ChatGPT (OpenAI)
```javascript
// Works via CDN script tag in web pages
// Or as a Node.js tool for ChatGPT plugins
const analysis = WriteLikeMe.analyzeText('User message text');
const svg = WriteLikeMe.generateStyleSVG(analysis);
```

### With Claude (Anthropic)
```javascript
// Pure JavaScript - works in any environment
// No model-specific integration needed
const WriteLikeMe = require('@ai-clyde/writelikeme');
const result = WriteLikeMe.analyzeText(inputText);
```

### With Custom/Local LLMs
```javascript
// Any AI model that can execute JavaScript or Node.js
// Just require/import the package
const WriteLikeMe = require('@ai-clyde/writelikeme');
```

## Benefits

- **Model-agnostic**: Works with any AI model since it's pure JavaScript
- **Visual feedback**: SVG circles provide immediate visual understanding of text characteristics
- **Consistent API**: Same `analyzeText()` and `generateStyleSVG()` functions across all models
- **No model changes needed**: Pure JS functions, no model-specific modifications required

## Browser CDN Usage

```html
<!-- Add this script tag to your HTML -->
<script src="https://cdn.jsdelivr.net/npm/@ai-clyde/writelikeme/index.js"></script>

<script>
  // Analyze text from user prompt
  const analysis = WriteLikeMe.analyzeText('Your code review comment here');
  
  // Generate SVG
  const svg = WriteLikeMe.generateStyleSVG(analysis);
  
  // Display or send to AI as context
  document.body.innerHTML = '<div>' + svg + '</div>';
</script>
```

## API Reference

### `analyzeText(text)`
- **Returns**: Object with formality, complexity, sentence_length, vocabulary, tone, creativity, confidence, wordCount, charCount
- **Use case**: Understand writing style before AI processing

### `generateStyleSVG(categories, width, height)`
- **Returns**: SVG string markup
- **Use case**: Visual representation of writing style characteristics