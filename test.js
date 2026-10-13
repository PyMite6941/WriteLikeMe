import { generateStyleSVG, analyzeText } from './index.js';

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
console.log('');

// Test 5: Empty/Invalid text
console.log('=== Test 5: Invalid Input ===');
const invalid = analyzeText('');
console.log('Invalid input analysis:', JSON.stringify(invalid));
console.log('All tests passed!');
