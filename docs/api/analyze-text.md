# analyzeText

Analyze a text string for writing style characteristics.

## Syntax

```javascript
const result = WriteLikeMe.analyzeText(text);
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | The text to analyze |

## Returns

| Property | Type | Description |
|----------|------|-------------|
| `formality` | `number` (0-1) | How formal the text is (0 = casual, 1 = formal) |
| `complexity` | `number` (0-1) | How complex the vocabulary is |
| `sentence_length` | `number` (0-1) | Average sentence length |
| `vocabulary` | `number` (0-1) | Sophistication of vocabulary |
| `tone` | `number` (0-1) | Emotional tone of the text |
| `creativity` | `number` (0-1) | Creativity level |
| `confidence` | `number` (0-1) | Analysis confidence score |
| `wordCount` | `number` | Total word count |
| `charCount` | `number` | Total character count |

## Example

```javascript
import WriteLikeMe from '@pymite6941/writelikeme';

const text = "This is a formal business proposal regarding quarterly financial results.";
const analysis = WriteLikeMe.analyzeText(text);

console.log(analysis);
/* Output:
{
  formality: 0.8,
  complexity: 0.6,
  sentence_length: 0.5,
  vocabulary: 0.7,
  tone: 0.4,
  creativity: 0.5,
  confidence: 0.9,
  wordCount: 9,
  charCount: 58
}
*/
*/
