const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const WriteLikeMe = require('./index.js');

const { generateStyleSVG, analyzeText } = WriteLikeMe;
const { compareTextStyle } = WriteLikeMe;
const { readStyleCode, writeLikeMe } = WriteLikeMe;
assert.equal(typeof compareTextStyle, 'function');
assert.equal(typeof readStyleCode, 'function');
assert.equal(typeof writeLikeMe, 'function');

// Test 1: Analyze sample text
console.log('=== Test 1: Text Analysis ===');
const sampleText = "This is a formal business proposal regarding the quarterly financial results and strategic initiatives we must consider for the upcoming fiscal year.";
const analysis = analyzeText(sampleText);
console.log('Input:', sampleText.substring(0, 50) + '...');
console.log('Analysis:', JSON.stringify(analysis));
console.log('');

// Test 2: Generate SVG for analyzed text
console.log('=== Test 2: SVG Generation ===');
const svg = generateStyleSVG(analysis);
console.log('SVG generated successfully, length:', svg.length, 'chars');
console.log('SVG preview:', svg.substring(0, 200) + '...');
console.log('');

// Test 3: Default categories
console.log('=== Test 3: Default Categories ===');
const defaultSvg = generateStyleSVG();
console.log('Default SVG generated, length:', defaultSvg.length, 'chars');
console.log('');

// Test 4: Custom categories
console.log('=== Test 4: Custom Categories ===');
const customSvg = generateStyleSVG({
  formality: 0.9,
  complexity: 0.3,
  creativity: 0.8,
  tone: 0.7
});
console.log('Custom SVG generated, length:', customSvg.length, 'chars');
const zeroScoreSvg = generateStyleSVG({ formality: 0 });
const mediumScoreSvg = generateStyleSVG({ formality: 0.5 });
const fullScoreSvg = generateStyleSVG({ formality: 1 });
const getSignalDots = (markup, category) => Array.from(
  markup.matchAll(new RegExp(`<circle[^>]*data-category="${category}"[^>]*>`, 'g')),
  ([circle]) => ({
    active: circle.includes('class="signal-dot active"'),
    radius: Number(circle.match(/\br="([0-9.]+)"/)[1])
  })
);
const zeroDots = getSignalDots(zeroScoreSvg, 'formality');
const mediumDots = getSignalDots(mediumScoreSvg, 'formality');
const fullDots = getSignalDots(fullScoreSvg, 'formality');
assert.equal(zeroDots.length, 54);
assert.equal(zeroDots.filter(dot => dot.active).length, 0);
assert.equal(mediumDots.filter(dot => dot.active).length, 27);
assert.equal(fullDots.filter(dot => dot.active).length, 54);
assert.ok(fullDots[0].radius > mediumDots[0].radius);
assert.match(fullScoreSvg, /width="320" height="320"/);
assert.match(fullScoreSvg, /WriteLikeMe Code/);
assert.match(fullScoreSvg, /not a scannable QR code/i);
console.log('');

// Test 5: Text characteristics produce distinct, bounded scores.
console.log('=== Test 5: Heuristic Scores ===');
const formal = analyzeText('Furthermore, this report requires a comprehensive review of the evidence.');
const casual = analyzeText('Yeah, this is cool and awesome!');
const negative = analyzeText('This is a terrible, awful result.');
const positive = analyzeText('This is a wonderful and helpful result!');
const vivid = analyzeText('Bright dreams shimmer as the ocean whispers.');
const plain = analyzeText('The report describes the process and lists several steps.');
const commaHeavy = analyzeText('One, two, three, four, five.');
const periodHeavy = analyzeText('One. Two. Three. Four. Five.');
const noStops = analyzeText('One two three four five');

assert.ok(formal.formality > casual.formality);
assert.ok(formal.complexity > analyzeText('Short words here.').complexity);
assert.ok(formal.sentence_length > analyzeText('Brief. Clear.').sentence_length);
assert.ok(formal.vocabulary > analyzeText('report report report report').vocabulary);
assert.ok(positive.tone > negative.tone);
assert.ok(vivid.creativity > plain.creativity);
assert.ok(commaHeavy.punctuation > periodHeavy.punctuation);
assert.equal(commaHeavy.commaCount, 4);
assert.equal(commaHeavy.periodCount, 1);
assert.equal(periodHeavy.commaCount, 0);
assert.equal(periodHeavy.periodCount, 5);
assert.equal(noStops.punctuation, 0.5);
assert.equal(noStops.commaShare, 0.5);
assert.equal(analyzeText('').punctuation, 0.5);
assert.equal(analyzeText('').frequentWords.length, 0);
assert.equal(analyzeText('').first_person, 0);
assert.equal(analyzeText('').question_rate, 0);
const commaSvg = generateStyleSVG(commaHeavy);
assert.equal((commaSvg.match(/data-punctuation="comma"/g) || []).length, 43);
assert.equal((commaSvg.match(/data-punctuation="period"/g) || []).length, 11);
const periodSvg = generateStyleSVG(periodHeavy);
assert.equal((periodSvg.match(/data-punctuation="comma"/g) || []).length, 0);
assert.equal((periodSvg.match(/data-punctuation="period"/g) || []).length, 54);

Object.keys(analysis).filter(key => ![
  'wordCount', 'charCount', 'commaCount', 'periodCount', 'semicolonCount',
  'colonCount', 'dashCount', 'questionCount', 'exclamationCount'
].includes(key)).forEach(key => {
  if (key === 'frequentWords') {
    assert.ok(Array.isArray(analysis[key]));
    return;
  }
  assert.ok(analysis[key] >= 0 && analysis[key] <= 1, `${key} is within 0-1`);
});
console.log('Text signals produce distinct scores within the documented range.');
console.log('');

// Test 6: Voice cues and inverse style comparison.
console.log('=== Test 6: Voice Cues and Style Match ===');
const userVoice = [
  "I think we should review this carefully. I'm not sure it's ready, and honestly, we should try again.",
  'I usually prefer a clear answer, but I might be wrong.'
].join('\n\n');
const matchingDraft = [
  "I think we should examine this carefully. I'm not certain it's ready, and honestly, we should try again.",
  'I usually prefer a clear answer, though I could be mistaken.'
].join('\n\n');
const oppositeDraft = 'Furthermore, a comprehensive evaluation is necessary; the optimal recommendation should be implemented immediately! Does the evidence demonstrate its effectiveness?';
const voice = analyzeText(userVoice);
const matchingComparison = compareTextStyle(userVoice, matchingDraft);
const oppositeComparison = compareTextStyle(userVoice, oppositeDraft);
assert.ok(voice.first_person > 0);
assert.ok(voice.contraction_rate > 0);
assert.ok(analyzeText('I’m ready.').contraction_rate > 0);
assert.ok(voice.sentence_variation > 0);
assert.ok(voice.paragraph_length > analyzeText('A short line.\n\nAnother short line.').paragraph_length);
assert.ok(voice.frequentWords.includes('review'));
assert.ok(analyzeText('Should we proceed?').question_rate > 0);
assert.ok(analyzeText('Excellent!').exclamation_rate > 0);
assert.ok(analyzeText('However, we should wait.').transition_rate > 0);
assert.ok(analyzeText('Perhaps we should wait.').hedging_rate > 0);
assert.ok(matchingComparison.similarity > oppositeComparison.similarity);
assert.ok(matchingComparison.similarity >= 0 && matchingComparison.similarity <= 1);
assert.ok(oppositeComparison.differences.first_person > matchingComparison.differences.first_person);
assert.equal(compareTextStyle('', 'A valid sample.').similarity, 0);
console.log(
  'Matched draft similarity:',
  matchingComparison.similarity,
  'vs contrasting draft:',
  oppositeComparison.similarity
);
console.log('');

// Test 7: Empty/Invalid text
console.log('=== Test 7: Invalid Input ===');
const invalid = analyzeText('');
console.log('Invalid input analysis:', JSON.stringify(invalid));
console.log('All tests passed!');

// Test 8: CLI entry points and package scripts have useful output.
console.log('=== Test 8: Command-Line Interface ===');
const analyzeCommand = spawnSync(process.execPath, [
  'cli.js', 'analyze', 'A', 'sample', 'sentence.'
], { encoding: 'utf8' });
assert.equal(analyzeCommand.status, 0, analyzeCommand.stderr);
assert.equal(JSON.parse(analyzeCommand.stdout).wordCount, 3);

const generateCommand = spawnSync(process.execPath, [
  'cli.js', 'generate', 'A', 'sample', 'sentence.'
], { encoding: 'utf8' });
assert.equal(generateCommand.status, 0, generateCommand.stderr);
assert.match(generateCommand.stdout, /<svg\b/);
assert.match(generateCommand.stdout, /WriteLikeMe Code/);

const defaultGenerateCommand = spawnSync(process.execPath, [
  'cli.js', 'generate'
], { encoding: 'utf8' });
assert.equal(defaultGenerateCommand.status, 0, defaultGenerateCommand.stderr);
assert.match(defaultGenerateCommand.stdout, /<svg\b/);

const missingTextCommand = spawnSync(process.execPath, [
  'cli.js', 'analyze'
], { encoding: 'utf8' });
assert.equal(missingTextCommand.status, 1);
assert.match(missingTextCommand.stderr, /provide text to analyze/i);
console.log('CLI analysis, SVG generation, and missing-input handling verified.');

// Test 9: Shareable style metadata and local writing.
console.log('=== Test 9: Style Code and Local Writing ===');
const styleCode = generateStyleSVG({
  ...voice,
  frequentWords: ["user's", 'review']
});
const decodedStyle = readStyleCode(styleCode);
assert.equal(decodedStyle.schemaVersion, 1);
assert.equal(decodedStyle.categories.formality, voice.formality);
assert.equal(decodedStyle.signals.first_person, voice.first_person);
assert.deepEqual(decodedStyle.frequentWords, ["user's", 'review']);
const legacyStyle = readStyleCode(
  styleCode.replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata\s*>/i, '')
);
Object.keys(decodedStyle.categories).forEach(category => {
  assert.ok(
    Math.abs(legacyStyle.categories[category] - decodedStyle.categories[category]) <= 1 / 54,
    `${category} survives the legacy SVG round-trip within one signal cell`
  );
});
assert.throws(
  () => readStyleCode(styleCode.replace('&quot;schemaVersion&quot;:1', '&quot;schemaVersion&quot;:2')),
  /Unsupported or invalid/
);

const writingPrompt = 'Write a short paragraph about community gardens.';
const localDraft = writeLikeMe(writingPrompt, decodedStyle);
assert.match(localDraft, /community gardens/i);
assert.equal(localDraft, writeLikeMe(writingPrompt, decodedStyle));
assert.throws(() => writeLikeMe('  ', decodedStyle), /non-empty string/);
const shortFirstPersonDraft = writeLikeMe('Write about clear writing.', {
  categories: {
    sentence_length: 0.1
  },
  signals: {
    first_person: 1,
    contraction_rate: 1
  }
});
assert.match(shortFirstPersonDraft, /I'd|I think it's/);
const secondPersonDraft = writeLikeMe('Explain why clear writing matters.', {
  categories: {
    sentence_length: 0.5,
    punctuation: 0.6
  },
  signals: {
    second_person: 1,
    contraction_rate: 1
  }
});
assert.match(secondPersonDraft, /you'll find it's worth/i);

const styleCodePath = path.join(os.tmpdir(), 'writelikeme-style-' + process.pid + '.svg');
fs.writeFileSync(styleCodePath, styleCode);
try {
  const writeCommand = spawnSync(process.execPath, [
    'cli.js', 'write', '--style-code', styleCodePath, writingPrompt
  ], { encoding: 'utf8' });
  assert.equal(writeCommand.status, 0, writeCommand.stderr);
  assert.match(writeCommand.stdout, /community gardens/i);
} finally {
  fs.unlinkSync(styleCodePath);
}
console.log('SVG profile round-trip, legacy import, and offline writing verified.');
