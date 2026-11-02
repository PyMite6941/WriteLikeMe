const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const WriteLikeMe = require('./index.js');
const { Handler, createHandler } = require('./handler.js');

const { generateStyleSVG, analyzeText, readStyleCode, writeLikeMe } = WriteLikeMe;

let passed = 0;
let failed = 0;
function t(name, fn) {
  try {
    fn();
    passed++;
    console.log('PASS', name);
  } catch (e) {
    failed++;
    console.log('FAIL', name, '->', e.message);
  }
}

// --- Handler construction / connection ---
t('handler default state', () => {
  const h = new Handler();
  assert.equal(h.isConnected(), false);
  assert.deepEqual(h.profile.categories.formality, 0.5);
});

t('createHandler factory', () => {
  const h = createHandler();
  assert.ok(h instanceof Handler);
  assert.equal(h.isConnected(), false);
});

t('connect with profile object', () => {
  const h = new Handler();
  const snap = h.connect({ categories: { formality: 0.9 }, signals: { first_person: 1 } });
  assert.equal(h.isConnected(), true);
  assert.equal(snap.profile.categories.formality, 0.9);
  assert.equal(snap.profile.signals.first_person, 1);
});

t('connect with SVG string', () => {
  const h = new Handler();
  const svg = generateStyleSVG({ formality: 0.7, creativity: 0.2 });
  const snap = h.connect(svg);
  assert.equal(h.isConnected(), true);
  assert.equal(snap.profile.categories.formality, 0.7);
  assert.equal(snap.profile.categories.creativity, 0.2);
});

t('connect with undefined/null', () => {
  const h = new Handler();
  h.connect(undefined);
  assert.equal(h.isConnected(), true);
  h.connect(null);
  assert.equal(h.isConnected(), true);
});

t('connect non-string non-object throws', () => {
  const h = new Handler();
  assert.throws(() => h.connect(123), /TypeError/);
  assert.throws(() => h.connect(true), /TypeError/);
  assert.throws(() => h.connect(['a']), /TypeError/);
});

t('connectFromFile round trip', () => {
  const h = new Handler();
  const svg = generateStyleSVG({ formality: 0.5 });
  const file = path.join(os.tmpdir(), 'wlm-handler-test-' + process.pid + '.svg');
  fs.writeFileSync(file, svg, 'utf8');
  try {
    const snap = h.connectFromFile(file);
    assert.equal(h.isConnected(), true);
    assert.equal(snap.source, file);
    assert.equal(snap.profile.categories.formality, 0.5);
  } finally {
    fs.unlinkSync(file);
  }
});

t('connectFromFile missing file throws', () => {
  const h = new Handler();
  assert.throws(() => h.connectFromFile(path.join(os.tmpdir(), 'does-not-exist-wlm.svg')));
});

t('snapshot returns state', () => {
  const h = new Handler();
  h.connect({ categories: { tone: 0.8 } });
  const snap = h.snapshot();
  assert.equal(snap.connected, true);
  assert.equal(snap.profile.categories.tone, 0.8);
  assert.ok(Array.isArray(Object.keys(snap)));
});

// --- analyze / generate / write / compare through handler ---
t('handler analyze', () => {
  const h = new Handler();
  const result = h.analyze('This is a formal business proposal.');
  assert.equal(result.wordCount, 6);
  assert.ok(result.formality >= 0 && result.formality <= 1);
});

t('handler analyze non-string throws', () => {
  const h = new Handler();
  assert.throws(() => h.analyze(null), /TypeError/);
});

t('handler generateSVG uses connected profile', () => {
  const h = new Handler();
  h.connect({ categories: { formality: 1, creativity: 0 } });
  const svg = h.generateSVG();
  assert.match(svg, /<svg\b/);
  assert.match(svg, /WriteLikeMe Code/);
  const decoded = readStyleCode(svg);
  assert.equal(decoded.categories.formality, 1);
});

t('handler generateSVG accepts overrides', () => {
  const h = new Handler();
  h.connect({ categories: { formality: 0 } });
  const svg = h.generateSVG({ formality: 1 }, 800, 600);
  assert.match(svg, /width="800" height="600"/);
  const decoded = readStyleCode(svg);
  assert.equal(decoded.categories.formality, 1);
});

t('handler write uses connected profile', () => {
  const h = new Handler();
  h.connect({
    categories: { sentence_length: 0.1 },
    signals: { first_person: 1, contraction_rate: 1 }
  });
  const draft = h.write('Write about clear writing.');
  assert.match(draft, /I'd|I think it's/);
});

t('handler write not connected throws', () => {
  const h = new Handler();
  assert.throws(() => h.write('hello'), /not connected/);
});

t('handler write empty prompt throws', () => {
  const h = new Handler();
  h.connect({});
  assert.throws(() => h.write('   '), /TypeError/);
});

t('handler compare', () => {
  const h = new Handler();
  const r = h.compare('Hello world.', 'Hello world.');
  assert.equal(r.similarity, 1);
  const r2 = h.compare('', 'Hi there.');
  assert.equal(r2.similarity, 0);
});

t('handler compare non-string throws', () => {
  const h = new Handler();
  assert.throws(() => h.compare(null, 'hi'), /TypeError/);
});

// --- share / import / export ---
t('share returns portable profile', () => {
  const h = new Handler();
  h.connect({ categories: { formality: 0.8 }, signals: { first_person: 0.5 } });
  const shared = h.share();
  assert.equal(shared.format, 'writelikeme-profile');
  assert.equal(shared.version, 1);
  assert.equal(shared.profile.categories.formality, 0.8);
  assert.equal(shared.profile.signals.first_person, 0.5);
  assert.equal(shared.connected, true);
});

t('import shared profile from another handler', () => {
  const a = new Handler();
  a.connect({ categories: { creativity: 0.9 }, signals: { hedging_rate: 0.4 } });
  const shared = a.share();
  const b = new Handler();
  assert.equal(b.isConnected(), false);
  const snap = b.import(shared);
  assert.equal(b.isConnected(), true);
  assert.equal(snap.profile.categories.creativity, 0.9);
  assert.equal(snap.profile.signals.hedging_rate, 0.4);
});

t('import invalid shared profile throws', () => {
  const h = new Handler();
  assert.throws(() => h.import({}), /TypeError/);
  assert.throws(() => h.import({ profile: 'nope' }), /TypeError/);
  assert.throws(() => h.import(null), /TypeError/);
});

t('exportToFile / importFromFile round trip', () => {
  const h = new Handler();
  h.connect({ categories: { tone: 0.7, complexity: 0.3 }, signals: { transition_rate: 0.6 } });
  const file = path.join(os.tmpdir(), 'wlm-export-' + process.pid + '.json');
  try {
    h.exportToFile(file);
    assert.ok(fs.existsSync(file));
    const h2 = new Handler();
    h2.importFromFile(file);
    assert.equal(h2.isConnected(), true);
    assert.equal(h2.profile.categories.tone, 0.7);
    assert.equal(h2.profile.categories.complexity, 0.3);
    assert.equal(h2.profile.signals.transition_rate, 0.6);
  } finally {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
});

t('reset clears connection', () => {
  const h = new Handler();
  h.connect({ categories: { formality: 0.9 } });
  assert.equal(h.isConnected(), true);
  const snap = h.reset();
  assert.equal(h.isConnected(), false);
  assert.equal(snap.connected, false);
  assert.equal(snap.source, null);
});

// --- SVG integrity (flawless + shareable) ---
t('svg metadata carries complete profile', () => {
  const svg = generateStyleSVG({
    formality: 0.8, complexity: 0.4, sentence_length: 0.6,
    vocabulary: 0.7, tone: 0.5, creativity: 0.9, punctuation: 0.3
  });
  const decoded = readStyleCode(svg);
  assert.equal(decoded.schemaVersion, 3);
  assert.deepEqual(decoded.categories.formality, 0.8);
  assert.deepEqual(decoded.categories.creativity, 0.9);
  assert.ok(decoded.signals);
  assert.ok(Array.isArray(decoded.frequentWords));
  assert.ok(decoded.stats);
});

t('svg carries grammar and sentence-structure signals', () => {
  const svg = generateStyleSVG({
    formality: 0.8, complexity: 0.4, sentence_length: 0.6,
    vocabulary: 0.7, tone: 0.5, creativity: 0.9, punctuation: 0.3
  });
  const decoded = readStyleCode(svg);
  // Grammar signals present and bounded.
  ['comma_splice_rate', 'semicolon_spam_rate', 'run_on_sentence_rate'].forEach(function(s) {
    assert.ok(typeof decoded.signals[s] === 'number' && decoded.signals[s] >= 0 && decoded.signals[s] <= 1, s + ' bounded');
  });
  // Sentence structure signals present and bounded.
  ['simple_sentence_rate', 'compound_sentence_rate', 'complex_sentence_rate'].forEach(function(s) {
    assert.ok(typeof decoded.signals[s] === 'number' && decoded.signals[s] >= 0 && decoded.signals[s] <= 1, s + ' bounded');
  });
  // Punctuation rhythm and quote style.
  assert.ok(typeof decoded.signals.punctuation_rhythm === 'number' && decoded.signals.punctuation_rhythm >= 0 && decoded.signals.punctuation_rhythm <= 1);
  assert.ok(decoded.signals.quote_style === 0 || decoded.signals.quote_style === 1);
  // Domain and grade label.
  assert.ok(typeof decoded.domain === 'string');
  assert.ok(typeof decoded.readability.gradeLabel === 'string');
  assert.ok(typeof decoded.styleClassification.gradeLabel === 'string');
});

t('svg round trip preserves scores exactly', () => {
  // Scores are rounded to 2 decimals by design (roundScore); use 2-decimal inputs.
  const input = { formality: 0.12, complexity: 0.46, sentence_length: 0.79, vocabulary: 0.32, tone: 0.65, creativity: 0.99, punctuation: 0.11 };
  const svg = generateStyleSVG(input);
  const decoded = readStyleCode(svg);
  Object.keys(input).forEach(function(key) {
    assert.equal(decoded.categories[key], input[key], key + ' preserved');
  });
});

t('svg legacy fallback recovers categories', () => {
  const svg = generateStyleSVG({ formality: 0.5, punctuation: 0.5 });
  const legacy = readStyleCode(svg.replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata\s*>/i, ''));
  Object.keys(legacy.categories).forEach(function(category) {
    assert.ok(Math.abs(legacy.categories[category] - 0.5) <= 1 / 54, category + ' within one cell');
  });
});

console.log('\nHandler tests: ' + passed + ' passed, ' + failed + ' failed');
process.exitCode = failed === 0 ? 0 : 1;
