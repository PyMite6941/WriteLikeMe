// Accuracy benchmark: does the style brief describe clearly different samples correctly?
// Run with `npm run bench`. Exits 1 if accuracy drops below the threshold.
const path = require('path');
const WriteLikeMe = require('../index.js');
const samples = require('./samples.json');

const THRESHOLD = 0.85;
const checks = {
  register: (brief, value) => new RegExp('^Register: ' + value, 'm').test(brief),
  voice: (brief, value) => {
    const line = (brief.match(/^Voice: .*$/m) || [''])[0];
    if (value === 'first person') return line.includes('first person');
    if (value === 'you') return line.includes('"you"');
    return line.includes('mostly third person');
  },
  contractions: (brief, value) => brief.includes(value + ' contractions'),
  sentences: (brief, value) => new RegExp('^Sentences: ' + value.replace('medium', 'medium-length'), 'm').test(brief),
  questions: (brief) => brief.includes('ask the reader questions'),
  exclamations: (brief) => brief.includes('use exclamation marks'),
  hedging: (brief) => brief.includes('hedge claims'),
  dialogue: (brief) => brief.includes('quote dialogue')
};

let passed = 0;
let total = 0;
const failures = [];
console.log('Accuracy benchmark — describeStyle vs bench/samples.json\n');
console.log('Sample                                Passed  Facts   Missing or incorrect facts');
console.log('------------------------------------ ------  -----   ----------------------------');
samples.forEach((sample) => {
  const brief = WriteLikeMe.describeStyle(WriteLikeMe.analyzeText(sample.text));
  const keys = Object.keys(sample.expect);
  let samplePassed = 0;
  const missing = [];
  keys.forEach((key) => {
    total += 1;
    if (checks[key](brief, sample.expect[key])) {
      samplePassed += 1;
      passed += 1;
    } else {
      missing.push(`${key} = ${JSON.stringify(sample.expect[key])}`);
      failures.push(`${sample.name}: expected ${key} = ${JSON.stringify(sample.expect[key])}`);
    }
  });
  console.log(`${(sample.name + ' '.repeat(36)).slice(0, 36)} ${(samplePassed + '/' + keys.length) + ' '.repeat(6 - (samplePassed + '/' + keys.length).length)} ${keys.length}   ${missing.length ? missing.join('; ') : 'ok'}`);
});

const accuracy = passed / total;
console.log(`\nStyle brief accuracy: ${passed}/${total} (${Math.round(accuracy * 100)}%) on ${samples.length} samples (threshold ${Math.round(THRESHOLD * 100)}%).`);
failures.forEach((failure) => console.log('  MISS ' + failure));
if (accuracy < THRESHOLD) {
  console.error(`Accuracy below ${THRESHOLD * 100}%.`);
  process.exit(1);
}
