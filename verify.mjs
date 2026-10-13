import fs from 'fs';
const content = fs.readFileSync('/home/pymite6941/services/local_storage/WriteLikeMe/index.js', 'utf8');

// Check if exports are at module level
console.log('Has module.exports:', content.includes('module.exports'));
console.log('Has exports.generateStyleSVG:', content.includes('exports.generateStyleSVG'));
console.log('Has Has exports.analyzeText:', content.includes('exports.analyzeText'));

// Extract the export lines
const lines = content.split('\n');
lines.forEach((line, i) => {
  if (line.includes('module.exports') || line.includes('exports.')) {
    console.log('Line ' + (i+1) + ': ' + line);
  }
});
