import assert from 'assert';
import WriteLikeMe from './index.js';

const { generateStyleSVG, analyzeText } = WriteLikeMe;

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
const commaSvg = generateStyleSVG(commaHeavy);
assert.equal((commaSvg.match(/data-punctuation="comma"/g) || []).length, 43);
assert.equal((commaSvg.match(/data-punctuation="period"/g) || []).length, 11);
const periodSvg = generateStyleSVG(periodHeavy);
assert.equal((periodSvg.match(/data-punctuation="comma"/g) || []).length, 0);
assert.equal((periodSvg.match(/data-punctuation="period"/g) || []).length, 54);

Object.keys(analysis).filter(key => !['wordCount', 'charCount', 'commaCount', 'periodCount'].includes(key)).forEach(key => {
  assert.ok(analysis[key] >= 0 && analysis[key] <= 1, `${key} is within 0-1`);
});
console.log('Text signals produce distinct scores within the documented range.');
console.log('');

// Test 6: Empty/Invalid text
console.log('=== Test 6: Invalid Input ===');
const invalid = analyzeText('');
console.log('Invalid input analysis:', JSON.stringify(invalid));
console.log('All tests passed!');
