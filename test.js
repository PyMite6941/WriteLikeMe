const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const WriteLikeMe = require('./index.js');

const { generateStyleSVG, analyzeText } = WriteLikeMe;
const { compareTextStyle } = WriteLikeMe;
const { readStyleCode, writeLikeMe } = WriteLikeMe;
const { checkDraft } = WriteLikeMe;
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
  'colonCount', 'dashCount', 'questionCount', 'exclamationCount',
  'punctuationBreakdown', 'vocabularyBreakdown', 'readability', 'styleClassification',
  'domain'
].includes(key)).forEach(key => {
  if (key === 'frequentWords') {
    assert.ok(Array.isArray(analysis[key]));
    return;
  }
  if (typeof analysis[key] === 'object') {
    assert.ok(analysis[key] !== null, `${key} is an object`);
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
assert.ok(analyzeText("That's it. Here's why it's done.").contraction_rate > 0, "'s contractions count");
assert.strictEqual(analyzeText("John's report and the team's plan are ready.").contraction_rate, 0, 'possessives are not contractions');
assert.ok(analyzeText("I've done it. I'm sure I'll do it again.").first_person > 0, 'contracted first-person pronouns count');
assert.ok(analyzeText('You’re right, you’ll see.').second_person > 0, 'curly contracted second-person pronouns count');
(function() {
  var W = require('./index.js');
  var vivid = W.createStyleProfile({ categories: { creativity: 0.9, sentence_length: 0.5 }, signals: { sentence_variation: 0.6 } });
  var casual = W.createStyleProfile(analyzeText("Honestly, I think you'll like it. You build it, you ship it. That's it. Here's what I've learned: don't overthink it."));
  [vivid, casual].forEach(function(profile) {
    W.writeLikeMe('Write a note about our garden.', profile).split(/(?<=[.!?])\s+/).forEach(function(sentence) {
      assert.match(sentence, /^[A-Z]/, 'draft sentences start with a capital: ' + sentence);
    });
  });
})();
assert.match(require("./index.js").describeStyle(analyzeText("Honestly, I think it's simple. You build it, you ship it, and that's it. I didn't plan much. Here's what I've learned: don't overthink it, and you'll be fine.")), /use contractions/);
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
assert.equal(decodedStyle.schemaVersion, 3);
assert.equal(decodedStyle.categories.formality, voice.formality);
assert.equal(decodedStyle.signals.first_person, voice.first_person);
assert.deepEqual(decodedStyle.frequentWords.map(function(w) { return w.word; }), ["user's", 'review']);
const legacyStyle = readStyleCode(
  styleCode.replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata\s*>/i, '')
);
Object.keys(decodedStyle.categories).forEach(category => {
  assert.ok(
    Math.abs(legacyStyle.categories[category] - decodedStyle.categories[category]) <= 1 / 54,
    `${category} survives the legacy SVG round-trip within one signal cell`
  );
});
// v3 is now a valid schema; v3 round-trip preserves it.
const v3svg = styleCode.replace('&quot;schemaVersion&quot;:1', '&quot;schemaVersion&quot;:3');
const decodedV3 = readStyleCode(v3svg);
assert.equal(decodedV3.schemaVersion, 3);
assert.equal(decodedV3.categories.formality, decodedStyle.categories.formality);

// Grammar and sentence-structure signals are present and bounded.
assert.ok(decodedStyle.signals.comma_splice_rate >= 0 && decodedStyle.signals.comma_splice_rate <= 1);
assert.ok(decodedStyle.signals.semicolon_spam_rate >= 0 && decodedStyle.signals.semicolon_spam_rate <= 1);
assert.ok(decodedStyle.signals.run_on_sentence_rate >= 0 && decodedStyle.signals.run_on_sentence_rate <= 1);
assert.ok(decodedStyle.signals.simple_sentence_rate >= 0 && decodedStyle.signals.simple_sentence_rate <= 1);
assert.ok(decodedStyle.signals.compound_sentence_rate >= 0 && decodedStyle.signals.compound_sentence_rate <= 1);
assert.ok(decodedStyle.signals.complex_sentence_rate >= 0 && decodedStyle.signals.complex_sentence_rate <= 1);
assert.ok(decodedStyle.signals.punctuation_rhythm >= 0 && decodedStyle.signals.punctuation_rhythm <= 1);
assert.ok(decodedStyle.signals.quote_style === 0 || decodedStyle.signals.quote_style === 1);
assert.ok(typeof decodedStyle.domain === 'string');
assert.ok(typeof decodedStyle.readability.gradeLabel === 'string');
assert.ok(typeof decodedStyle.styleClassification.gradeLabel === 'string');

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
assert.match(secondPersonDraft, /you'll notice it's worth/i);

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

// Test 10: analyzeSamples joins multiple samples and counts them.
console.log('=== Test 10: Multiple Samples ===');
const joined = WriteLikeMe.analyzeSamples(['First sample about apples.', '', 'Second sample about apples and oranges.']);
assert.equal(joined.sampleCount, 2, 'sampleCount counts non-empty samples');
assert.ok(joined.frequentWords.indexOf('apples') !== -1, 'joined analysis keeps topic words');
assert.deepEqual(WriteLikeMe.analyzeSamples([]).frequentWords, []);
assert.equal(WriteLikeMe.analyzeSamples([]).sampleCount, 0);
assert.equal(WriteLikeMe.analyzeSamples(['', '   ']).sampleCount, 0);
assert.equal(WriteLikeMe.analyzeSamples(['only one']).sampleCount, 1);
assert.equal(WriteLikeMe.analyzeSamples(null).sampleCount, 0);
console.log('analyzeSamples joins non-empty samples with blank lines and reports sampleCount.');
console.log('');

// Test 11: frequentWords excludes contractions and the extended stopword list.
console.log('=== Test 11: Better Signature Words ===');
const filler = WriteLikeMe.analyzeText("Honestly, I think it's working. I really like it, and I think you should get it. Basically it's just great.");
const fillerWords = filler.frequentWords;
['think', 'really', 'like', 'should', 'get', 'basically', 'just', "it's", "i'm"].forEach(function(blocked) {
  assert.equal(fillerWords.indexOf(blocked), -1, blocked + ' should be excluded from frequent words');
});
assert.ok(fillerWords.indexOf('working') !== -1, 'real topic words are kept');
assert.ok(fillerWords.indexOf('great') !== -1, 'real topic words are kept');
assert.ok(fillerWords.length <= 5, 'no more than five frequent words');
const contracted = WriteLikeMe.analyzeText('it’s fine, I’m sure it\'s fine.').frequentWords;
assert.equal(contracted.indexOf("it’s"), -1, 'curly-apostrophe contraction excluded');
assert.equal(contracted.indexOf("it's"), -1, 'straight-apostrophe contraction excluded');
assert.equal(contracted.indexOf("I’m"), -1, 'curly contracted pronoun excluded');
assert.equal(contracted.indexOf("I'm"), -1, 'straight contracted pronoun excluded');
console.log('frequentWords excludes contractions and extended filler words.');
console.log('');

// Test 12: signaturePhrases and the describeStyle openers line.
console.log('=== Test 12: Signature Phrases ===');
const openerText = 'In my view, this is fine. In my view, that is also fine. In my view, we agree. A one-off opener once.';
const op = WriteLikeMe.analyzeText(openerText);
assert.deepEqual(op.signaturePhrases, [{ phrase: 'in my', count: 3 }]);
assert.ok(op.signaturePhrases.length <= 5);
op.signaturePhrases.forEach(function(entry) {
  assert.ok(typeof entry.phrase === 'string' && typeof entry.count === 'number');
  assert.ok(entry.count >= 2, 'openers must appear at least twice');
});
assert.deepEqual(WriteLikeMe.analyzeText('Hello world. Goodbye world.').signaturePhrases, [], 'one-off openers are not included');
assert.equal(WriteLikeMe.analyzeText('Hi. Bye.').signaturePhrases.length, 0, 'single-word sentences cannot form openers');
assert.ok(WriteLikeMe.describeStyle(op).indexOf('Typical openers: in my.') !== -1, 'describeStyle lists typical openers');
assert.ok(WriteLikeMe.describeStyle(WriteLikeMe.analyzeText('Hello world. Goodbye world.')).indexOf('Typical openers') === -1, 'no openers line when absent');
console.log('signaturePhrases are computed and described.');
console.log('');

// Test 13: includeWords privacy option empties words and phrases.
console.log('=== Test 13: Privacy Option (includeWords) ===');
const sample = 'apple apple banana. cherry cherry cherry. delta echo foxtrot.';
const withWords = WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText(sample));
assert.ok(withWords.frequentWords.length > 0);
const withoutWords = WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText(sample), { includeWords: false });
assert.equal(withoutWords.frequentWords.length, 0, 'profile frequentWords emptied');
assert.equal(withoutWords.signaturePhrases.length, 0, 'profile signaturePhrases emptied');
const withDefault = WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText(sample));
assert.ok(withDefault.frequentWords.length > 0, 'words kept by default');
const svgWithout = WriteLikeMe.generateStyleSVG(WriteLikeMe.analyzeText(sample), undefined, undefined, { includeWords: false });
const decodedWithout = WriteLikeMe.readStyleCode(svgWithout);
assert.equal(decodedWithout.frequentWords.length, 0, 'SVG metadata frequentWords emptied');
assert.equal(decodedWithout.signaturePhrases.length, 0, 'SVG metadata signaturePhrases emptied');
const svgWith = WriteLikeMe.generateStyleSVG(WriteLikeMe.analyzeText(sample));
assert.ok(WriteLikeMe.readStyleCode(svgWith).frequentWords.length > 0, 'SVG metadata keeps words by default');
console.log('includeWords:false empties frequent words and signature phrases in profiles and SVG metadata.');

// Test 14: checkDraft scores a draft against a profile and reports issues.
console.log('=== Test 14: Draft Checking ===');
const userProfile = WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText('I think it is simple. You build it, you ship it. That is it. Here is what I learned.'));
const matching = 'I think it is simple. You build it, you ship it. That is it.';
const matchResult = checkDraft(userProfile, matching);
assert.ok(matchResult.score >= 0 && matchResult.score <= 1, 'score within 0-1');
assert.equal(matchResult.pass, matchResult.score >= 0.8, 'pass = score >= default min 0.8');
assert.ok(Array.isArray(matchResult.issues), 'issues is an array');
assert.ok(matchResult.issues.length <= 5, 'at most five issues');
matchResult.issues.forEach(function(issue) {
  ['signal', 'yours', 'draft', 'fix'].forEach(function(key) {
    assert.ok(key in issue, 'issue has ' + key);
  });
  assert.equal(typeof issue.yours, 'number', 'yours is a number');
  assert.equal(typeof issue.draft, 'number', 'draft is a number');
  assert.ok(typeof issue.fix === 'string' && issue.fix.length > 0 && issue.fix.length < 120, 'fix is a short sentence: ' + issue.fix);
});
var gaps = matchResult.issues.map(function(issue) { return Math.abs(issue.yours - issue.draft); });
for (var k = 1; k < gaps.length; k++) assert.ok(gaps[k - 1] >= gaps[k], 'issues sorted largest gap first');
matchResult.issues.forEach(function(issue) { assert.ok(Math.abs(issue.yours - issue.draft) >= 0.14, 'reported gap >= 0.15'); });

// min threshold controls pass/fail (CI behaviour).
assert.ok(checkDraft(userProfile, matching, { min: 0.99 }).pass === false, 'high min fails');
assert.ok(checkDraft(userProfile, matching, { min: 0 }).pass === true, 'low min passes');

// A clearly different draft scores lower and yields issues.
var veryDifferent = 'Furthermore, a comprehensive evaluation is necessary; the optimal recommendation should be implemented immediately!';
var diffResult = checkDraft(userProfile, veryDifferent);
assert.ok(diffResult.score < matchResult.score, 'different draft scores lower');
assert.ok(diffResult.pass === false, 'very different draft fails default min');
assert.ok(diffResult.issues.length > 0, 'very different draft has issues');

// Accepts an SVG string as well as a profile object.
var styleSvg = WriteLikeMe.generateStyleSVG(userProfile);
var fromSvg = checkDraft(styleSvg, matching);
assert.equal(fromSvg.score, matchResult.score, 'SVG string and profile give the same score');

// Named context round-trips through SVG metadata and heads describeStyle.
var ctxSvg = WriteLikeMe.generateStyleSVG(Object.assign(WriteLikeMe.analyzeText('I think we should ship this. You will like it.'), { context: 'blog' }));
var decodedCtx = WriteLikeMe.readStyleCode(ctxSvg);
assert.equal(decodedCtx.context, 'blog', 'context stored in SVG metadata');
var brief = WriteLikeMe.describeStyle(decodedCtx);
assert.equal(brief.indexOf('Context: blog.'), 0, 'Context: blog. is the first describeStyle line');
assert.equal(WriteLikeMe.describeStyle(userProfile).indexOf('Context:') === -1, true, 'no Context line when absent');
console.log('checkDraft score/pass/issues, min threshold, SVG input, and named context verified.');
console.log('');

// The brief is multi-line plain text (regression: lines were once joined with a literal backslash-n).
(function() {
  var W = require('./index.js');
  var brief = W.describeStyle(W.analyzeText("I think it's simple. I think you'll like it. You build it and ship it."));
  assert.ok(brief.split('\n').length >= 5, 'brief has one line per item');
  assert.strictEqual(brief.indexOf('\\n'), -1, 'no literal backslash-n in the brief');
  assert.match(brief, /^Typical openers: i think\.$/m);
  var withContext = W.describeStyle(Object.assign(W.createStyleProfile(W.analyzeText('Hello there. This is me.')), { context: 'email' }));
  assert.match(withContext, /^Context: email\.\nRegister:/);
  var check = W.checkDraft(W.createStyleProfile(W.analyzeText("I think it's simple. You build it, you ship it. That's it.")),
    'The committee has determined that implementation shall commence, subject to the approval of all relevant stakeholders.');
  assert.ok(check.issues.length > 0);
  check.issues.forEach(function(issue) { assert.ok(!/_/.test(issue.fix), 'fix text is human-readable: ' + issue.fix); });
})();
console.log('Style brief formatting and readable check fixes verified.');
