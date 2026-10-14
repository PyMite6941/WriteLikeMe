(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WriteLikeMe = factory();
  }
})(typeof globalThis === 'object' ? globalThis : this, function() {
// WriteLikeMe Writing Style Visualizer

var exports = {};
var DEFAULT_STYLE_CATEGORIES = {
  formality: 0.5,
  complexity: 0.5,
  sentence_length: 0.5,
  vocabulary: 0.5,
  tone: 0.5,
  creativity: 0.5,
  punctuation: 0.5
};

var CATEGORY_NAMES = [
  'formality',
  'complexity',
  'sentence_length',
  'vocabulary',
  'tone',
  'creativity',
  'punctuation'
];

var FORMAL_WORDS = new Set([
  'accordingly', 'consequently', 'furthermore', 'however', 'moreover',
  'nevertheless', 'therefore', 'thus', 'regarding', 'require', 'approximately',
  'sufficient', 'shall', 'whom'
]);
var CASUAL_WORDS = new Set([
  'awesome', 'basically', 'cool', 'gonna', 'gotta', 'kinda', 'lol', 'nah',
  'okay', 'ok', 'stuff', 'super', 'wanna', 'yeah', 'yep', 'yup'
]);
var POSITIVE_WORDS = new Set([
  'amazing', 'beautiful', 'best', 'delight', 'delighted', 'enjoy', 'excellent',
  'excited', 'fantastic', 'good', 'great', 'happy', 'helpful', 'hope', 'love',
  'wonderful', 'success', 'successful', 'thank', 'thanks'
]);
var NEGATIVE_WORDS = new Set([
  'angry', 'awful', 'bad', 'boring', 'broken', 'disappointed', 'hate',
  'horrible', 'sad', 'terrible', 'unfortunately', 'worse', 'worst'
]);
var IMAGERY_WORDS = new Set([
  'bloom', 'bright', 'dance', 'dream', 'glow', 'luminous', 'magic', 'magical',
  'ocean', 'shadow', 'shimmer', 'whisper', 'wonder', 'vivid'
]);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value) {
  return Math.round(clamp(value, 0, 1) * 100) / 100;
}

function tokenize(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

function countSetMatches(words, wordSet) {
  return words.reduce(function(count, word) {
    return count + (wordSet.has(word) ? 1 : 0);
  }, 0);
}

function emptyAnalysis() {
  return {
    ...DEFAULT_STYLE_CATEGORIES,
    confidence: 0,
    wordCount: 0,
    charCount: 0,
    commaCount: 0,
    periodCount: 0,
    commaShare: 0.5
  };
}

// Generate SVG circles for writing style category scores.
exports.generateStyleSVG = function(cats, width, height) {
  var opts = cats && typeof cats === 'object' ? cats : {};
  var svgWidth = Number.isFinite(width) && width > 0 ? width : 320;
  var svgHeight = Number.isFinite(height) && height > 0 ? height : 320;
  var codeSize = Math.min(svgWidth, svgHeight);
  var gridSize = 18;
  var cellSize = codeSize * 0.036;
  var gridX = (svgWidth - cellSize * gridSize) / 2;
  var gridY = Math.max(codeSize * 0.14, (svgHeight - cellSize * gridSize * CATEGORY_NAMES.length * 3) / 2 - codeSize * 0.016);
  var cornerStart = codeSize * 0.05;
  var cornerArm = codeSize * 0.085;
  var colors = [177, 188, 197, 165, 205, 153, 35];
  var categoryLabels = ['F', 'C', 'L', 'V', 'T', 'R', 'P'];
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgWidth + '" height="' + svgHeight + '" viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '">';
  svg += '<title>WriteLikeMe Code - decorative writing style profile</title>';
  svg += '<desc>A square, QR-inspired pattern encodes seven writing signals. The punctuation band uses comma shapes and period dots to show their balance. This is not a scannable QR code.</desc>';
  svg += '<defs><radialGradient id="code-bg"><stop offset="0%" stop-color="#14263a"/><stop offset="100%" stop-color="#080e19"/></radialGradient></defs>';
  svg += '<rect width="100%" height="100%" rx="' + (codeSize * 0.045) + '" fill="url(#code-bg)"/>';
  svg += '<path d="M' + cornerStart + ' ' + (cornerStart + cornerArm) + 'V' + cornerStart + 'h' + cornerArm +
    ' M' + (svgWidth - cornerStart - cornerArm) + ' ' + cornerStart + 'h' + cornerArm + 'v' + cornerArm +
    ' M' + (svgWidth - cornerStart) + ' ' + (svgHeight - cornerStart - cornerArm) + 'v' + cornerArm + 'h-' + cornerArm +
    '" fill="none" stroke="#35506a" stroke-width="' + (codeSize * 0.0047) + '"/>';
  svg += '<text x="' + gridX + '" y="' + (gridY - codeSize * 0.04) + '" font-family="monospace" font-size="' + (codeSize * 0.027) + '" letter-spacing="2" fill="#73e0bd">WLM // STYLE SIGNAL</text>';

  CATEGORY_NAMES.forEach(function(category, index) {
    var input = opts[category];
    var score = typeof input === 'number' && Number.isFinite(input)
      ? clamp(input, 0, 1)
      : DEFAULT_STYLE_CATEGORIES[category];
    var activeCount = Math.round(score * gridSize * 3);
    var circleRadius = cellSize * (0.12 + score * 0.22);
    var hue = colors[index];
    var bandStartRow = index * 3;

    for (var row = 0; row < 3; row++) {
      for (var column = 0; column < gridSize; column++) {
        var cellIndex = row * gridSize + column;
        var isActive = (cellIndex * 17 + index * 11) % (gridSize * 3) < activeCount;
        var cx = gridX + column * cellSize + cellSize / 2;
        var cy = gridY + (bandStartRow + row) * cellSize + cellSize / 2;
        var radius = isActive ? circleRadius : cellSize * 0.055;
        var opacity = isActive ? 0.55 + score * 0.4 : 0.2;

        if (category === 'punctuation') {
          if (isActive) {
            svg += '<text class="signal-mark comma" data-category="punctuation" data-punctuation="comma" x="' +
              (cx - cellSize * 0.3).toFixed(2) + '" y="' + (cy + cellSize * 0.3).toFixed(2) +
              '" font-family="monospace" font-size="' + (cellSize * 0.9).toFixed(2) +
              '" font-weight="700" fill="#f0b867">,</text>';
          } else {
            svg += '<circle class="signal-mark period" data-category="punctuation" data-punctuation="period" cx="' +
              cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="' + (cellSize * 0.11).toFixed(2) +
              '" fill="#73e0bd" opacity="0.72"/>';
          }
        } else {
          svg += '<circle class="signal-dot' + (isActive ? ' active' : '') + '" data-category="' + category + '" cx="' + cx.toFixed(2) + '" cy="' + cy.toFixed(2) + '" r="' + radius.toFixed(2) + '" fill="hsl(' + hue + ', 88%, ' + (isActive ? 62 : 32) + '%)" opacity="' + opacity.toFixed(2) + '"/>';
        }
      }
    }

    svg += '<text x="' + (gridX - cellSize * 0.72) + '" y="' + (gridY + (bandStartRow + 1.7) * cellSize) + '" text-anchor="middle" font-family="monospace" font-size="' + (cellSize * 0.65) + '" fill="hsl(' + hue + ', 88%, 68%)">' + categoryLabels[index] + '</text>';
  });

  svg += '<text x="' + (svgWidth * 0.07) + '" y="' + (svgHeight * 0.94) + '" font-family="monospace" font-size="' + (codeSize * 0.035) + '" font-weight="700" letter-spacing="1" fill="#d9e5f2">WriteLikeMe Code</text>';
  svg += '<text x="' + (svgWidth * 0.93) + '" y="' + (svgHeight * 0.94) + '" text-anchor="end" font-family="monospace" font-size="' + (codeSize * 0.02) + '" letter-spacing="1" fill="#73e0bd">7 SIGNALS // LOCAL</text>';
  svg += '</svg>';
  return svg;
};

// Return transparent, dictionary-based signals rather than model predictions.
exports.analyzeText = function(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return emptyAnalysis();
  }

  var trimmedText = text.trim();
  var words = tokenize(trimmedText);
  var wordCount = words.length;
  if (wordCount === 0) {
    return emptyAnalysis();
  }

  var uniqueWords = new Set(words);
  var averageWordLength = words.reduce(function(total, word) {
    return total + Array.from(word).length;
  }, 0) / wordCount;
  var longWordCount = words.filter(function(word) {
    return Array.from(word).length >= 7;
  }).length;
  var sentences = trimmedText.split(/(?<=[.!?])\s+|\n+/u).filter(function(sentence) {
    return tokenize(sentence).length > 0;
  });
  var averageSentenceLength = wordCount / Math.max(sentences.length, 1);
  var formalCount = countSetMatches(words, FORMAL_WORDS);
  var casualCount = countSetMatches(words, CASUAL_WORDS);
  var positiveCount = countSetMatches(words, POSITIVE_WORDS);
  var negativeCount = countSetMatches(words, NEGATIVE_WORDS);
  var imageryCount = countSetMatches(words, IMAGERY_WORDS);
  var lexicalDiversity = uniqueWords.size / Math.sqrt(wordCount);
  var punctuationKinds = new Set(trimmedText.match(/[.!?,;:—-]/gu) || []).size;
  var exclamationCount = (trimmedText.match(/!/gu) || []).length;
  var commaCount = (trimmedText.match(/,/gu) || []).length;
  var periodCount = (trimmedText.match(/\./gu) || []).length;
  var commaShare = commaCount + periodCount === 0
    ? 0.5
    : commaCount / (commaCount + periodCount);

  var formality = (formalCount + 1) / (formalCount + casualCount + 2);
  var complexity = (
    clamp((averageWordLength - 3) / 5, 0, 1) * 0.7 +
    clamp(longWordCount / wordCount * 2, 0, 1) * 0.3
  );
  var sentenceLength = clamp(averageSentenceLength / 30, 0, 1);
  var vocabulary = clamp(lexicalDiversity / 2.5, 0, 1);
  var tone = (positiveCount + 1) / (positiveCount + negativeCount + 2);
  var creativity = (
    vocabulary * 0.45 +
    clamp(imageryCount / wordCount * 5, 0, 1) * 0.4 +
    clamp((punctuationKinds + Math.min(exclamationCount, 3)) / 6, 0, 1) * 0.15
  );

  return {
    formality: roundScore(formality),
    complexity: roundScore(complexity),
    sentence_length: roundScore(sentenceLength),
    vocabulary: roundScore(vocabulary),
    tone: roundScore(tone),
    creativity: roundScore(creativity),
    punctuation: roundScore(commaShare),
    confidence: roundScore(wordCount / 200),
    wordCount: wordCount,
    charCount: trimmedText.length,
    commaCount: commaCount,
    periodCount: periodCount,
    commaShare: roundScore(commaShare)
  };
};

exports.DEFAULT_STYLE_CATEGORIES = DEFAULT_STYLE_CATEGORIES;
return exports;
});
