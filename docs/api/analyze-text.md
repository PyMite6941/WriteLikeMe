# analyzeText

Analyze a text string and return heuristic scores and text counts.

## Syntax

```javascript
const result = WriteLikeMe.analyzeText(text);
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | Text to analyze. Non-string values return the empty-input result. |

## Returns

| Property | Type | Current behavior |
|----------|------|------------------|
| `formality` | `number` (0-1) | Keyword ratio from a small set of formal and casual words |
| `complexity` | `number` (0-1) | Average word length and proportion of words with seven or more characters |
| `sentence_length` | `number` (0-1) | Average words per sentence, normalized against 30 words |
| `vocabulary` | `number` (0-1) | Unique-token count adjusted by the square root of total token count |
| `tone` | `number` (0-1) | Ratio of words in small positive/negative keyword lists; `0.5` if neither appears |
| `creativity` | `number` (0-1) | Weighted combination of vocabulary variety, imagery keywords, and punctuation variety |
| `punctuation` | `number` (0-1) | Share of commas among commas and periods; `0.5` when neither appears |
| `confidence` | `number` (0-1) | Word count divided by 200, capped at 1; not statistical confidence |
| `wordCount` | `number` | Count of Unicode letter/number tokens |
| `charCount` | `number` | UTF-16 code-unit count after trimming leading and trailing whitespace |
| `commaCount` | `number` | Number of comma characters |
| `periodCount` | `number` | Number of period characters |
| `commaShare` | `number` (0-1) | Same comma-to-period balance as `punctuation` |

Non-string, empty, and whitespace-only input returns the default category values,
zero confidence, zero word/character/punctuation counts, and neutral punctuation
balance.

The punctuation signal measures comma-versus-period habits, not grammatical
correctness. Its SVG band uses comma-shaped marks and period dots to make that
balance visually distinct.

## Example

```javascript
const WriteLikeMe = require('@ai-clyde/writelikeme');

const result = WriteLikeMe.analyzeText('Hello, world!');
console.log(result.wordCount); // 2
console.log(result.charCount); // 13
console.log(result.complexity); // 0.28
console.log(result.vocabulary); // 0.57
console.log(result.confidence); // 0.01
```

Tokenization recognizes Unicode letters and numbers. The keyword lists are
small, English-focused, and do not understand context, negation, sarcasm, or
word meaning outside the listed terms. The sentence and word-length metrics
are simple proxies. Results are experimental, may be inaccurate (especially
for short text or other languages), and must not be treated as a reliable
linguistic or psychological measurement or used for consequential decisions.
