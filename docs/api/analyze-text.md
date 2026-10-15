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
| `semicolonCount`, `colonCount`, `dashCount` | `number` | Counts of these punctuation marks |
| `questionCount`, `exclamationCount` | `number` | Question and exclamation mark counts |
| `first_person`, `second_person` | `number` (0-1) | Scaled rates of first- and second-person pronouns |
| `contraction_rate` | `number` (0-1) | Scaled contraction frequency |
| `sentence_variation` | `number` (0-1) | Coefficient of variation for sentence lengths, capped at 1 |
| `paragraph_length` | `number` (0-1) | Average paragraph word count normalized against 60 words |
| `question_rate`, `exclamation_rate` | `number` (0-1) | Mark counts per sentence, capped at 1 |
| `transition_rate`, `hedging_rate` | `number` (0-1) | Scaled frequency of words from small English-language lists |
| `frequentWords` | `string[]` | Up to five most frequent content words, excluding a small common-word list |

Non-string, empty, and whitespace-only input returns the default category values,
zero confidence, zero word/character/punctuation counts, zero voice-cue scores,
an empty `frequentWords` list, and neutral punctuation balance.

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

## Compare a draft with a reference

Use `compareTextStyle(referenceText, candidateText)` to check whether an AI
draft resembles the user's analyzed style:

```javascript
const comparison = WriteLikeMe.compareTextStyle(userSample, generatedDraft);
console.log(comparison.similarity); // 0-1 heuristic similarity
console.log(comparison.differences.formality); // Absolute difference for a style signal
console.log(comparison.differences.frequentWordsOverlap); // 0-1 word overlap
```

`similarity` is the average similarity across the seven SVG categories, numeric
voice cues, and frequent-word overlap, rounded to two decimal places.
`differences` contains the absolute difference for each numeric signal and
`frequentWordsOverlap`, the Jaccard overlap of the two `frequentWords` lists
(higher is a closer match). It compares style cues, not meaning, and cannot
guarantee that a draft sounds like its author. If either text has no analyzable
words, `similarity` is `0`.

The SVG's visible pattern uses the seven categories accepted by
`generateStyleSVG`. Its embedded metadata also stores the additional voice-cue
scores and frequent words; these are not separate SVG bands. Use
`readStyleCode(svg)` to retrieve that profile.
