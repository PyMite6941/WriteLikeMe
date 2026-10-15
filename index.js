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
var FIRST_PERSON_WORDS = new Set(['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours']);
var SECOND_PERSON_WORDS = new Set(['you', 'your', 'yours']);
var TRANSITION_WORDS = new Set([
  'also', 'although', 'because', 'besides', 'consequently', 'finally',
  'first', 'furthermore', 'however', 'instead', 'meanwhile', 'moreover',
  'next', 'otherwise', 'therefore', 'though', 'thus'
]);
var HEDGING_WORDS = new Set([
  'apparently', 'arguably', 'perhaps', 'possibly', 'probably', 'seem',
  'seems', 'sometimes', 'suggest', 'suggests', 'usually'
]);
var COMMON_WORDS = new Set([
  'about', 'after', 'again', 'also', 'because', 'been', 'being', 'could',
  'does', 'doing', 'from', 'have', 'here', 'just', 'like', 'more', 'most',
  'much', 'only', 'other', 'over', 'same', 'some', 'such', 'than', 'that',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'under', 'very', 'were', 'what', 'when', 'where', 'which',
  'while', 'with', 'would', 'your'
]);
var STYLE_SIGNAL_NAMES = [
  'formality',
  'complexity',
  'sentence_length',
  'vocabulary',
  'tone',
  'creativity',
  'punctuation',
  'first_person',
  'second_person',
  'contraction_rate',
  'sentence_variation',
  'paragraph_length',
  'question_rate',
  'exclamation_rate',
  'transition_rate',
  'hedging_rate'
];

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
    commaShare: 0.5,
    semicolonCount: 0,
    colonCount: 0,
    dashCount: 0,
    questionCount: 0,
    exclamationCount: 0,
    first_person: 0,
    second_person: 0,
    contraction_rate: 0,
    sentence_variation: 0,
    paragraph_length: 0,
    question_rate: 0,
    exclamation_rate: 0,
    transition_rate: 0,
    hedging_rate: 0,
    frequentWords: []
  };
}

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, function(character) {
    return {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    }[character];
  });
}

function decodeXml(value) {
  return value.replace(/&(amp|lt|gt|quot|apos);/g, function(entity, name) {
    return {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'"
    }[name];
  });
}

function profileScore(source, key, fallback) {
  var value = source && source[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? roundScore(value)
    : fallback;
}

function createStyleProfile(input) {
  var source = input && typeof input === 'object' ? input : {};
  var categories = source.categories && typeof source.categories === 'object'
    ? source.categories
    : source;
  var signals = source.signals && typeof source.signals === 'object'
    ? source.signals
    : source;
  var profile = {
    schemaVersion: 1,
    categories: {},
    signals: {},
    frequentWords: [],
    stats: {}
  };

  CATEGORY_NAMES.forEach(function(category) {
    profile.categories[category] = profileScore(
      categories,
      category,
      DEFAULT_STYLE_CATEGORIES[category]
    );
  });
  STYLE_SIGNAL_NAMES.filter(function(signal) {
    return CATEGORY_NAMES.indexOf(signal) === -1;
  }).forEach(function(signal) {
    profile.signals[signal] = profileScore(signals, signal, 0);
  });

  if (Array.isArray(source.frequentWords)) {
    profile.frequentWords = source.frequentWords
      .filter(function(word) {
        return typeof word === 'string' && /^[\p{L}\p{N}][\p{L}\p{N}'’-]*$/u.test(word);
      })
      .slice(0, 5)
      .map(function(word) {
        return word.slice(0, 40);
      });
  }

  var stats = source.stats && typeof source.stats === 'object' ? source.stats : source;
  [
    'wordCount',
    'charCount',
    'commaCount',
    'periodCount',
    'semicolonCount',
    'colonCount',
    'dashCount',
    'questionCount',
    'exclamationCount'
  ].forEach(function(stat) {
    var value = stats[stat];
    if (Number.isSafeInteger(value) && value >= 0) {
      profile.stats[stat] = value;
    }
  });
  profile.stats.confidence = profileScore(stats, 'confidence', 0);
  return profile;
}

function readLegacyStyleCode(svg) {
  var categories = {};
  var foundSignal = false;

  CATEGORY_NAMES.slice(0, -1).forEach(function(category) {
    var pattern = new RegExp(
      '<circle\\b(?=[^>]*\\bclass="signal-dot active")(?=[^>]*\\bdata-category="' +
        category + '")[^>]*>',
      'g'
    );
    var count = (svg.match(pattern) || []).length;
    if (svg.indexOf('data-category="' + category + '"') !== -1) {
      foundSignal = true;
      categories[category] = count / 54;
    }
  });

  var commaCount = (svg.match(/data-punctuation="comma"/g) || []).length;
  var periodCount = (svg.match(/data-punctuation="period"/g) || []).length;
  if (commaCount + periodCount > 0) {
    foundSignal = true;
    categories.punctuation = commaCount / (commaCount + periodCount);
  }
  if (!foundSignal) {
    throw new Error('SVG does not contain a WriteLikeMe style profile.');
  }
  return createStyleProfile({ categories: categories });
}

function normalizeStyleProfile(styleCode) {
  if (typeof styleCode === 'string') {
    return exports.readStyleCode(styleCode);
  }
  if (styleCode === undefined || styleCode === null) {
    return createStyleProfile({});
  }
  if (typeof styleCode !== 'object' || Array.isArray(styleCode)) {
    throw new TypeError('Style code must be an SVG string or a style profile object.');
  }
  return createStyleProfile(styleCode);
}

// Generate SVG circles for writing style category scores.
exports.generateStyleSVG = function(cats, width, height) {
  var input = cats && typeof cats === 'object' ? cats : {};
  var opts = input.categories && typeof input.categories === 'object'
    ? input.categories
    : input;
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
  svg += '<metadata id="writelikeme-profile" data-schema-version="1">' +
    escapeXml(JSON.stringify(createStyleProfile(input))) + '</metadata>';
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
  var sentenceWordCounts = sentences.map(function(sentence) {
    return tokenize(sentence).length;
  });
  var averageSentenceLength = wordCount / Math.max(sentenceWordCounts.length, 1);
  var sentenceLengthVariance = sentenceWordCounts.reduce(function(total, count) {
    return total + Math.pow(count - averageSentenceLength, 2);
  }, 0) / Math.max(sentenceWordCounts.length, 1);
  var sentenceLengthVariation = averageSentenceLength === 0
    ? 0
    : Math.sqrt(sentenceLengthVariance) / averageSentenceLength;
  var paragraphs = trimmedText.split(/\n\s*\n+/u).filter(function(paragraph) {
    return tokenize(paragraph).length > 0;
  });
  var averageParagraphLength = wordCount / Math.max(paragraphs.length, 1);
  var formalCount = countSetMatches(words, FORMAL_WORDS);
  var casualCount = countSetMatches(words, CASUAL_WORDS);
  var positiveCount = countSetMatches(words, POSITIVE_WORDS);
  var negativeCount = countSetMatches(words, NEGATIVE_WORDS);
  var imageryCount = countSetMatches(words, IMAGERY_WORDS);
  var firstPersonCount = countSetMatches(words, FIRST_PERSON_WORDS);
  var secondPersonCount = countSetMatches(words, SECOND_PERSON_WORDS);
  var transitionCount = countSetMatches(words, TRANSITION_WORDS);
  var hedgingCount = countSetMatches(words, HEDGING_WORDS);
  var lexicalDiversity = uniqueWords.size / Math.sqrt(wordCount);
  var punctuationKinds = new Set(trimmedText.match(/[.!?,;:—-]/gu) || []).size;
  var exclamationCount = (trimmedText.match(/!/gu) || []).length;
  var questionCount = (trimmedText.match(/\?/gu) || []).length;
  var commaCount = (trimmedText.match(/,/gu) || []).length;
  var periodCount = (trimmedText.match(/\./gu) || []).length;
  var semicolonCount = (trimmedText.match(/;/gu) || []).length;
  var colonCount = (trimmedText.match(/:/gu) || []).length;
  var dashCount = (trimmedText.match(/[—–-]/gu) || []).length;
  var contractionCount = (trimmedText.match(/\b[\p{L}\p{N}]+(?:n['’]t|['’](?:re|ve|ll|d|m))\b|\b(?:let['’]s|y['’]all)\b/giu) || []).length;
  var commaShare = commaCount + periodCount === 0
    ? 0.5
    : commaCount / (commaCount + periodCount);
  var wordFrequencies = new Map();
  words.forEach(function(word, index) {
    if (word.length < 4 || COMMON_WORDS.has(word)) {
      return;
    }
    var frequency = wordFrequencies.get(word);
    if (frequency) {
      frequency.count++;
    } else {
      wordFrequencies.set(word, { count: 1, firstIndex: index });
    }
  });
  var frequentWords = Array.from(wordFrequencies.entries()).sort(function(left, right) {
    return right[1].count - left[1].count || left[1].firstIndex - right[1].firstIndex;
  }).slice(0, 5).map(function(entry) {
    return entry[0];
  });

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
    commaShare: roundScore(commaShare),
    semicolonCount: semicolonCount,
    colonCount: colonCount,
    dashCount: dashCount,
    questionCount: questionCount,
    exclamationCount: exclamationCount,
    first_person: roundScore(clamp(firstPersonCount / wordCount / 0.15, 0, 1)),
    second_person: roundScore(clamp(secondPersonCount / wordCount / 0.15, 0, 1)),
    contraction_rate: roundScore(clamp(contractionCount / wordCount / 0.2, 0, 1)),
    sentence_variation: roundScore(clamp(sentenceLengthVariation, 0, 1)),
    paragraph_length: roundScore(clamp(averageParagraphLength / 60, 0, 1)),
    question_rate: roundScore(clamp(questionCount / Math.max(sentenceWordCounts.length, 1), 0, 1)),
    exclamation_rate: roundScore(clamp(exclamationCount / Math.max(sentenceWordCounts.length, 1), 0, 1)),
    transition_rate: roundScore(clamp(transitionCount / wordCount / 0.12, 0, 1)),
    hedging_rate: roundScore(clamp(hedgingCount / wordCount / 0.12, 0, 1)),
    frequentWords: frequentWords
  };
};

exports.compareTextStyle = function(referenceText, candidateText) {
  var reference = exports.analyzeText(referenceText);
  var candidate = exports.analyzeText(candidateText);
  var differences = {};
  var similarityTotal = 0;

  STYLE_SIGNAL_NAMES.forEach(function(signal) {
    var difference = roundScore(Math.abs(reference[signal] - candidate[signal]));
    differences[signal] = difference;
    similarityTotal += 1 - difference;
  });

  var referenceWords = new Set(reference.frequentWords);
  var candidateWords = new Set(candidate.frequentWords);
  var sharedWords = Array.from(referenceWords).filter(function(word) {
    return candidateWords.has(word);
  }).length;
  var wordUnionSize = new Set(Array.from(referenceWords).concat(Array.from(candidateWords))).size;
  var frequentWordsOverlap = wordUnionSize === 0 ? 0 : roundScore(sharedWords / wordUnionSize);
  differences.frequentWordsOverlap = frequentWordsOverlap;
  similarityTotal += frequentWordsOverlap;

  return {
    similarity: reference.wordCount === 0 || candidate.wordCount === 0
      ? 0
      : roundScore(similarityTotal / (STYLE_SIGNAL_NAMES.length + 1)),
    differences: differences
  };
};

exports.readStyleCode = function(svg) {
  if (typeof svg !== 'string' || !/<svg\b/i.test(svg)) {
    throw new TypeError('Style code must be an SVG string.');
  }
  var metadata = svg.match(
    /<metadata\b(?=[^>]*\bid=["']writelikeme-profile["'])[^>]*>([\s\S]*?)<\/metadata\s*>/i
  );
  if (!metadata) {
    return readLegacyStyleCode(svg);
  }

  var parsed;
  try {
    parsed = JSON.parse(decodeXml(metadata[1]));
  } catch (error) {
    throw new Error('WriteLikeMe SVG contains invalid profile metadata: ' + error.message);
  }
  if (
    !parsed ||
    parsed.schemaVersion !== 1 ||
    !parsed.categories ||
    typeof parsed.categories !== 'object' ||
    !parsed.signals ||
    typeof parsed.signals !== 'object' ||
    !Array.isArray(parsed.frequentWords) ||
    !parsed.stats ||
    typeof parsed.stats !== 'object'
  ) {
    throw new Error('Unsupported or invalid WriteLikeMe style profile version.');
  }
  CATEGORY_NAMES.concat(STYLE_SIGNAL_NAMES.filter(function(signal) {
    return CATEGORY_NAMES.indexOf(signal) === -1;
  })).forEach(function(signal) {
    var score = CATEGORY_NAMES.indexOf(signal) !== -1
      ? parsed.categories[signal]
      : parsed.signals[signal];
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
      throw new Error('WriteLikeMe SVG contains an invalid score for "' + signal + '".');
    }
  });
  return createStyleProfile(parsed);
};

exports.writeLikeMe = function(prompt, styleCode) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new TypeError('Prompt must be a non-empty string.');
  }

  var profile = normalizeStyleProfile(styleCode);
  var categories = profile.categories;
  var signals = profile.signals;
  var subject = prompt.trim().replace(/\s+/g, ' ');
  subject = subject
    .replace(/^(?:please\s+)?(?:write|draft|compose|create|generate)\s+(?:(?:a|an|the)\s+)?(?:(?:short|brief|concise|detailed|thoughtful|clear|simple|professional|friendly)\s+)*(?:(?:paragraph|essay|article|post|email|message|story|summary|explanation|response|letter|introduction|review|poem|script)\s+)?(?:about|on|regarding|concerning)\s+/i, '')
    .replace(/^(?:please\s+)?(?:explain|describe|discuss|summarize|outline|analyze)\s+/i, '')
    .replace(/[.!?]+$/g, '')
    .trim();
  if (subject.length > 180) {
    subject = subject.slice(0, 177).replace(/\s+\S*$/, '') + '...';
  }
  if (!subject) {
    subject = prompt.trim().slice(0, 180);
  }

  var formal = categories.formality >= 0.65;
  var positive = categories.tone >= 0.6;
  var cautious = categories.tone <= 0.4;
  var firstPerson = signals.first_person >= 0.3;
  var secondPerson = signals.second_person >= 0.3;
  var contractions = signals.contraction_rate >= 0.3;
  var useComma = categories.punctuation >= 0.6;
  var transitions = signals.transition_rate >= 0.25;
  var hedging = signals.hedging_rate >= 0.25;
  var vivid = categories.creativity >= 0.65;
  var sentenceLength = categories.sentence_length;
  var sophisticated = categories.complexity >= 0.55 || categories.vocabulary >= 0.7;
  var seed = Array.from(subject).reduce(function(total, character) {
    return (total + character.charCodeAt(0)) % 997;
  }, 0);
  var openings = firstPerson
    ? contractions
      ? [
        "I'd start by looking at what matters most in " + subject + '.',
        "I think it's worth taking a closer look at " + subject + '.'
      ]
      : [
        'I would start by looking at what matters most in ' + subject + '.',
        'I think it is worth taking a closer look at ' + subject + '.'
      ]
    : secondPerson
      ? contractions
        ? [
          "You'll find it easier to approach " + subject + ' by starting with the details.',
          "You can start with what matters most in " + subject + '.'
        ]
        : [
          'You will find it easier to approach ' + subject + ' by starting with the details.',
          'You can start with what matters most in ' + subject + '.'
        ]
      : formal || sophisticated
        ? [
      'A thoughtful approach to ' + subject + ' begins with understanding what matters most.',
      'Understanding ' + subject + ' starts with looking carefully at the details.'
          ]
        : contractions
          ? [
            "It's worth taking a closer look at " + subject + '.',
            "There's more to " + subject + ' than first meets the eye.'
          ]
          : [
            'It is worth taking a closer look at ' + subject + '.',
            'There is more to ' + subject + ' than first meets the eye.'
          ];
  var opening = openings[seed % openings.length];
  var actions = positive
    ? [
      'A useful next step is to focus on what can be improved.',
      'It helps to look for a practical way to make progress.'
    ]
    : cautious
      ? [
        'The next step is to look carefully at what could go wrong.',
        'It is worth considering the risks before moving forward.'
      ]
      : [
        'The next step is to focus on what matters most.',
        'A clear plan can make the next step easier to see.'
      ];
  var action = actions[Math.floor(seed / openings.length) % actions.length];
  var perspective = firstPerson
    ? (contractions ? "I think it's" : 'I think it is')
    : secondPerson
      ? (contractions ? "you'll find it's" : 'you will find it is')
      : (contractions ? "it's" : 'it is');
  var reflection = perspective + ' worth paying attention to the details';
  if (useComma) {
    reflection += ', because small choices can shape the outcome.';
  } else {
    reflection += ' and small choices can shape the outcome.';
  }

  if (vivid) {
    reflection = firstPerson
      ? 'I see ' + subject + ' as a path, and each careful choice helps reveal the way forward.'
      : subject + ' can be a path, with each careful choice revealing the way forward.';
  } else if (sentenceLength >= 0.55) {
    reflection += ', especially when the situation is complex.';
  }
  if (signals.paragraph_length >= 0.5 && sentenceLength >= 0.25 && !vivid) {
    reflection += ' That perspective can help turn an idea into a practical choice.';
  }
  if (hedging) {
    action = action.replace(' is ', ' may be ');
  }
  if (transitions) {
    action = 'Furthermore, ' + action.charAt(0).toLowerCase() + action.slice(1);
  }

  var sentences = sentenceLength < 0.25
    ? [opening, action]
    : signals.sentence_variation >= 0.45
      ? [opening, reflection, action]
      : [opening, action, reflection];
  return sentences.join(' ');
};

exports.DEFAULT_STYLE_CATEGORIES = DEFAULT_STYLE_CATEGORIES;
return exports;
});
