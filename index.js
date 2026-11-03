(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    // Expose the agent Handler lazily, so requiring handler.js first does not
    // create a circular load.
    ['Handler', 'createHandler'].forEach(function(name) {
      Object.defineProperty(module.exports, name, {
        enumerable: true,
        get: function() {
          return require('./handler.js')[name];
        }
      });
    });
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
function withContractions(words, contracted) {
  contracted.forEach(function(word) {
    words.push(word, word.replace("'", '’'));
  });
  return new Set(words);
}
var FIRST_PERSON_WORDS = withContractions(
  ['i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours', 'ourselves'],
  ["i'm", "i've", "i'll", "i'd", "we're", "we've", "we'll", "we'd"]
);
var SECOND_PERSON_WORDS = withContractions(
  ['you', 'your', 'yours', 'yourself', 'yourselves'],
  ["you're", "you've", "you'll", "you'd"]
);
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

// Expanded habit signals tracked in addition to STYLE_SIGNAL_NAMES.
// These live in the top-level analyzeText result and the v2 metadata so
// future algorithm versions can read them back from a shared SVG.
var HABIT_SIGNAL_NAMES = [
  'dialogue_rate',
  'all_caps_rate',
  'number_rate',
  'url_rate',
  'emoji_rate',
  'passive_rate',
  'punctuation_rhythm',
  'quote_style'
];

// Grammar mistake signals (detectable style flaws).
var GRAMMAR_SIGNAL_NAMES = [
  'comma_splice_rate',
  'semicolon_spam_rate',
  'run_on_sentence_rate'
];

// Sentence structure signals.
var SENTENCE_STRUCTURE_NAMES = [
  'simple_sentence_rate',
  'compound_sentence_rate',
  'complex_sentence_rate'
];

var SCHEMA_VERSION = 3;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundScore(value) {
  return Math.round(clamp(value, 0, 1) * 100) / 100;
}

// Heuristic syllable estimate (vowel groups, silent-e adjustment, min 1).
function estimateSyllables(word) {
  var cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleaned.length === 0) {
    return 0;
  }
  // Dictionary lookup first for accuracy on common words.
  if (SYLLABLE_DICT.has(cleaned)) {
    return 1;
  }
  var groups = cleaned.match(/[aeiouy]+/g);
  var count = groups ? groups.length : 0;
  if (cleaned.endsWith('e') && !cleaned.endsWith('le') && count > 1) {
    count--;
  }
  return Math.max(count, 1);
}

// Small built-in syllable dictionary for common English words (improves
// readability estimates over pure vowel-group heuristics).
var SYLLABLE_DICT = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on',
  'with','he','as','you','do','at','this','but','his','by','from','they','we',
  'say','her','she','or','an','will','my','one','all','would','there','their',
  'what','so','up','out','if','about','who','get','which','go','me','when',
  'make','can','like','time','no','just','him','know','take','people','into',
  'year','your','good','some','could','them','see','other','than','then','now',
  'look','only','come','its','over','think','also','back','after','use','two',
  'how','our','work','first','well','way','even','new','want','because','any',
  'these','give','day','most','us','is','was','are','been','has','had','were',
  'said','each','which','she','do','how','their','if','will','up','other','about',
  'out','many','then','them','these','so','some','her','would','make','like',
  'him','into','time','has','look','two','more','write','go','see','number',
  'no','way','could','people','my','than','first','water','been','call','who',
  'oil','its','now','find','long','down','day','did','get','come','made','may',
  'part'
]);

// Coordinating conjunctions (FANBOYS) for compound-sentence detection.
var COORDINATING_CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'so', 'yet', 'for', 'nor'
]);

// Subordinating conjunctions for complex-sentence detection.
var SUBORDINATING_CONJUNCTIONS = new Set([
  'after', 'although', 'as', 'because', 'before', 'even', 'if', 'since',
  'though', 'unless', 'until', 'when', 'whenever', 'whereas', 'wherever',
  'whether', 'while', 'why'
]);

// Domain keyword clusters for topic detection.
var DOMAIN_KEYWORDS = {
  business: ['revenue', 'profit', 'market', 'strategy', 'client', 'customer',
    'quarterly', 'fiscal', 'investment', 'stakeholder', 'roi', 'kpi',
    'enterprise', 'corporate', 'merger', 'acquisition', 'budget'],
  technical: ['api', 'database', 'server', 'code', 'software', 'algorithm',
    'framework', 'deploy', 'debug', 'compile', 'interface', 'function',
    'variable', 'syntax', 'compiler', 'backend', 'frontend', 'protocol'],
  academic: ['research', 'study', 'analysis', 'hypothesis', 'methodology',
    'literature', 'theory', 'evidence', 'conclusion', 'thesis', 'citation',
    'peer', 'review', 'abstract', 'dataset', 'variable', 'significance'],
  creative: ['story', 'character', 'plot', 'scene', 'novel', 'poem', 'poetry',
    'metaphor', 'imagery', 'narrative', 'protagonist', 'antagonist', 'dialogue',
    'setting', 'theme', 'symbolism', 'verse', 'stanza', 'prose'],
  legal: ['contract', 'liability', 'jurisdiction', 'plaintiff', 'defendant',
    'clause', 'statute', 'precedent', 'tort', 'covenant', 'affidavit',
    'litigation', 'compliance', 'regulation', 'legislation'],
  medical: ['diagnosis', 'patient', 'treatment', 'symptom', 'clinical',
    'therapy', 'medication', 'prescription', 'physician', 'hospital',
    'pathology', 'syndrome', 'prognosis', 'pediatric', 'cardiology']
};

// Simple stable checksum for profile integrity (not cryptographic).
function computeChecksum(obj) {
  var str = JSON.stringify(obj);
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
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
    formality: 0.5,
    complexity: 0.5,
    sentence_length: 0.5,
    vocabulary: 0.5,
    tone: 0.5,
    creativity: 0.5,
    punctuation: 0.5,
    confidence: 0,
    wordCount: 0,
    charCount: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    averageSentenceLength: 0,
    averageWordLength: 0,
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
    dialogue_rate: 0,
    all_caps_rate: 0,
    number_rate: 0,
    url_rate: 0,
    emoji_rate: 0,
    passive_rate: 0,
    comma_splice_rate: 0,
    semicolon_spam_rate: 0,
    run_on_sentence_rate: 0,
    simple_sentence_rate: 0,
    compound_sentence_rate: 0,
    complex_sentence_rate: 0,
    punctuation_rhythm: 0.5,
    quote_style: 0,
    frequentWords: [],
    punctuationBreakdown: {
      comma: 0, period: 0, semicolon: 0, colon: 0, dash: 0,
      question: 0, exclamation: 0, total: 0, commaShare: 0.5, varietyScore: 0
    },
    vocabularyBreakdown: {
      uniqueWordCount: 0, totalWordCount: 0, typeTokenRatio: 0,
      lexicalDiversity: 0.5, longWordRate: 0, averageWordLength: 0
    },
    readability: {
      fleschKincaidGrade: 0, fleschReadingEase: 0.5,
      avgSentenceLength: 0, avgSyllablesPerWord: 0,
      gradeLabel: 'standard'
    },
    styleClassification: {
      formalityLevel: 'standard', dominantMood: 'neutral',
      voice: 'third', pacing: 'medium', gradeLabel: 'standard'
    },
    domain: 'general'
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
    schemaVersion: SCHEMA_VERSION,
    generatedAt: source.generatedAt || new Date().toISOString(),
    categories: {},
    signals: {},
    punctuation: {},
    vocabulary: {},
    readability: { gradeLabel: 'standard' },
    styleClassification: { gradeLabel: 'standard' },
    frequentWords: [],
    stats: {},
    custom: source.custom && typeof source.custom === 'object' ? source.custom : {}
  };

  // Default domain to 'general' if not provided.
  if (typeof source.domain === 'string') {
    profile.custom.domain = source.domain;
    profile.domain = source.domain;
  } else if (typeof profile.custom.domain !== 'string') {
    profile.custom.domain = 'general';
    profile.domain = 'general';
  }

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
  HABIT_SIGNAL_NAMES.forEach(function(signal) {
    profile.signals[signal] = profileScore(signals, signal, 0);
  });
  GRAMMAR_SIGNAL_NAMES.forEach(function(signal) {
    profile.signals[signal] = profileScore(signals, signal, 0);
  });
  SENTENCE_STRUCTURE_NAMES.forEach(function(signal) {
    profile.signals[signal] = profileScore(signals, signal, 0);
  });

  // Preserve any extra signals not in the standard lists (forward-compatible).
  if (signals) {
    Object.keys(signals).forEach(function(key) {
      if (STYLE_SIGNAL_NAMES.indexOf(key) === -1 &&
          HABIT_SIGNAL_NAMES.indexOf(key) === -1 &&
          GRAMMAR_SIGNAL_NAMES.indexOf(key) === -1 &&
          SENTENCE_STRUCTURE_NAMES.indexOf(key) === -1 &&
          CATEGORY_NAMES.indexOf(key) === -1 &&
          typeof signals[key] === 'number' && Number.isFinite(signals[key])) {
        profile.signals[key] = roundScore(signals[key]);
      }
    });
  }

  if (Array.isArray(source.frequentWords)) {
    profile.frequentWords = source.frequentWords
      .filter(function(item) {
        if (typeof item === 'string') {
          return /^[\p{L}\p{N}][\p{L}\p{N}'’-]*$/u.test(item);
        }
        if (item && typeof item === 'object' && typeof item.word === 'string') {
          return /^[\p{L}\p{N}][\p{L}\p{N}'’-]*$/u.test(item.word);
        }
        return false;
      })
      .slice(0, 10)
      .map(function(item) {
        if (typeof item === 'string') {
          return { word: item.slice(0, 40), count: 1 };
        }
        return { word: String(item.word).slice(0, 40), count: typeof item.count === 'number' ? item.count : 1 };
      });
  }

  var stats = source.stats && typeof source.stats === 'object' ? source.stats : source;
  [
    'wordCount',
    'charCount',
    'sentenceCount',
    'paragraphCount',
    'averageSentenceLength',
    'averageWordLength',
    'commaCount',
    'periodCount',
    'semicolonCount',
    'colonCount',
    'dashCount',
    'questionCount',
    'exclamationCount'
  ].forEach(function(stat) {
    var value = stats[stat];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      profile.stats[stat] = value;
    }
  });
  profile.stats.confidence = profileScore(stats, 'confidence', 0);

  // Carry over structured sub-objects when present.
  if (source.punctuationBreakdown && typeof source.punctuationBreakdown === 'object') {
    profile.punctuationBreakdown = source.punctuationBreakdown;
  }
  if (source.vocabularyBreakdown && typeof source.vocabularyBreakdown === 'object') {
    profile.vocabularyBreakdown = source.vocabularyBreakdown;
  }
  if (source.readability && typeof source.readability === 'object') {
    profile.readability = source.readability;
  }
  if (source.styleClassification && typeof source.styleClassification === 'object') {
    profile.styleClassification = source.styleClassification;
  }

  // Carry over domain from custom when present.
  if (source.custom && typeof source.custom === 'object' && typeof source.custom.domain === 'string') {
    profile.custom.domain = source.custom.domain;
  }

  // Carry over domain from top-level source when present (analyzeText output).
  if (typeof source.domain === 'string') {
    profile.custom.domain = source.domain;
  }

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
  svg += '<metadata id="writelikeme-profile" data-schema-version="' + SCHEMA_VERSION + '">' +
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

  // Dialogue / quote heuristic: tokens wrapped in quotation marks.
  var quoteMatches = trimmedText.match(/["“”‘’][^"“”‘’]{1,60}["“”‘’]/g) || [];
  var dialogueRate = quoteMatches.length / Math.max(sentenceWordCounts.length, 1);

  // All-caps tokens (length >= 2) as emphasis/shouting indicator.
  var allCapsCount = words.filter(function(word) {
    return Array.from(word).length >= 2 && word === word.toUpperCase() && /[A-Z]/.test(word);
  }).length;

  // Numbers and URLs as separate style habits.
  var numberCount = (trimmedText.match(/\b\d+(?:\.\d+)?\b/g) || []).length;
  var urlCount = (trimmedText.match(/\bhttps?:\/\/[^\s]+/gi) || []).length;

  // Emoji / symbol density.
  var emojiCount = (trimmedText.match(/[\p{Emoji}\p{So}\p{Sk}]/gu) || []).length;

  // Passive-voice hint: "be" + past participle-ish (very rough, English only).
  var passiveHintCount = (trimmedText.match(/\b(?:is|are|was|were|be|been|being)\s+\w+ed\b/gi) || []).length;

  var lexicalDiversity = uniqueWords.size / Math.sqrt(wordCount);
  var punctuationKinds = new Set(trimmedText.match(/[.!?,;:—-]/gu) || []).size;
  var exclamationCount = (trimmedText.match(/!/gu) || []).length;
  var questionCount = (trimmedText.match(/\?/gu) || []).length;
  var commaCount = (trimmedText.match(/,/gu) || []).length;
  var periodCount = (trimmedText.match(/\./gu) || []).length;
  var semicolonCount = (trimmedText.match(/;/gu) || []).length;
  var colonCount = (trimmedText.match(/:/gu) || []).length;
  var dashCount = (trimmedText.match(/[—–-]/gu) || []).length;
  var contractionCount = (trimmedText.match(/\b[\p{L}\p{N}]+(?:n['’]t|['’](?:re|ve|ll|d|m))\b|\b(?:let|it|that|there|here|what|who|where|when|how|he|she|this|everyone|everybody|nobody|someone|something|nothing)['’]s\b|\by['’]all\b/giu) || []).length;
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

  // Readability (Flesch-Kincaid grade, approximate syllables).
  var totalSyllables = words.reduce(function(total, word) {
    return total + estimateSyllables(word);
  }, 0);
  var avgSyllablesPerWord = totalSyllables / wordCount;
  var fleschReadingEase = 206.835 - 1.015 * averageSentenceLength - 84.6 * avgSyllablesPerWord;
  var fleschKincaidGrade = 0.39 * averageSentenceLength + 11.8 * avgSyllablesPerWord - 15.59;

  // Style classifications (derived labels).
  var formalityLevel = formality >= 0.65 ? 'formal' : formality <= 0.35 ? 'casual' : 'standard';
  var dominantMood = tone >= 0.6 ? 'positive' : tone <= 0.4 ? 'negative' : 'neutral';
  var voice = firstPersonCount > secondPersonCount ? 'first' : secondPersonCount > firstPersonCount ? 'second' : (firstPersonCount + secondPersonCount > 0 ? 'mixed' : 'third');
  var pacing = sentenceLength >= 0.6 ? 'long' : sentenceLength <= 0.3 ? 'short' : 'medium';

  var punctuationTotal = commaCount + periodCount + semicolonCount + colonCount + dashCount + questionCount + exclamationCount;
  var punctuationVariety = clamp(punctuationKinds / 7, 0, 1);

  // Sentence structure classification: simple / compound / complex.
  var simpleCount = 0;
  var compoundCount = 0;
  var complexCount = 0;
  sentences.forEach(function(sentence) {
    var lower = sentence.toLowerCase();
    var tokens = tokenize(sentence);
    var hasCoordinator = false;
    var hasSubordinator = false;
    tokens.forEach(function(tok) {
      if (COORDINATING_CONJUNCTIONS.has(tok)) {
        hasCoordinator = true;
      }
      if (SUBORDINATING_CONJUNCTIONS.has(tok)) {
        hasSubordinator = true;
      }
    });
    if (hasSubordinator) {
      complexCount++;
    } else if (hasCoordinator) {
      compoundCount++;
    } else {
      simpleCount++;
    }
  });
  var totalSentences = Math.max(sentences.length, 1);
  var simpleSentenceRate = simpleCount / totalSentences;
  var compoundSentenceRate = compoundCount / totalSentences;
  var complexSentenceRate = complexCount / totalSentences;

  // Comma splice heuristic: comma followed by a capital letter or pronoun
  // starting a new clause (very rough, English only).
  var commaSpliceCount = 0;
  var commaSplicePattern = /,(\s+)(I|you|he|she|it|we|they|this|that|these|those)\b/gi;
  var m;
  while ((m = commaSplicePattern.exec(trimmedText)) !== null) {
    commaSpliceCount++;
  }
  var commaSpliceRate = commaSpliceCount / Math.max(sentenceWordCounts.length, 1);

  // Semicolon spam: semicolons per sentence (clamped).
  var semicolonSpamRate = semicolonCount / Math.max(totalSentences, 1);
  semicolonSpamRate = clamp(semicolonSpamRate / 0.5, 0, 1); // >0.5 per sentence = spam

  // Run-on sentence: sentences with 40+ words (no mid-sentence stop).
  var runOnCount = 0;
  sentenceWordCounts.forEach(function(count) {
    if (count >= 40) {
      runOnCount++;
    }
  });
  var runOnSentenceRate = runOnCount / totalSentences;

  // Punctuation rhythm: average words between punctuation marks.
  var punctuationRhythm = punctuationTotal > 0
    ? clamp(wordCount / punctuationTotal / 20, 0, 1)
    : 0.5;

  // Quote style: 0 = straight quotes ("), 1 = curly quotes (“”).
  var straightQuoteCount = (trimmedText.match(/"/g) || []).length;
  var curlyQuoteCount = (trimmedText.match(/[“”]/g) || []).length;
  var quoteStyle = curlyQuoteCount > straightQuoteCount ? 1 : 0;

  // Domain detection from keyword clusters.
  var domainScores = {};
  Object.keys(DOMAIN_KEYWORDS).forEach(function(domain) {
    var hits = 0;
    DOMAIN_KEYWORDS[domain].forEach(function(kw) {
      if (trimmedText.toLowerCase().indexOf(kw) !== -1) {
        hits++;
      }
    });
    domainScores[domain] = hits;
  });
  var bestDomain = 'general';
  var bestHits = 0;
  Object.keys(domainScores).forEach(function(domain) {
    if (domainScores[domain] > bestHits) {
      bestHits = domainScores[domain];
      bestDomain = domain;
    }
  });

  // Readability grade label from Flesch-Kincaid grade.
  var gradeLabel = 'standard';
  if (fleschKincaidGrade <= 6) {
    gradeLabel = 'elementary';
  } else if (fleschKincaidGrade <= 9) {
    gradeLabel = 'middle-school';
  } else if (fleschKincaidGrade <= 12) {
    gradeLabel = 'high-school';
  } else if (fleschKincaidGrade <= 16) {
    gradeLabel = 'college';
  } else {
    gradeLabel = 'graduate';
  }

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
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    averageSentenceLength: roundScore(clamp(averageSentenceLength / 50, 0, 1)),
    averageWordLength: roundScore(clamp((averageWordLength - 2) / 8, 0, 1)),
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
    contraction_rate: roundScore(clamp(contractionCount / wordCount / 0.06, 0, 1)),
    sentence_variation: roundScore(clamp(sentenceLengthVariation, 0, 1)),
    paragraph_length: roundScore(clamp(averageParagraphLength / 60, 0, 1)),
    question_rate: roundScore(clamp(questionCount / Math.max(sentenceWordCounts.length, 1), 0, 1)),
    exclamation_rate: roundScore(clamp(exclamationCount / Math.max(sentenceWordCounts.length, 1), 0, 1)),
    transition_rate: roundScore(clamp(transitionCount / wordCount / 0.12, 0, 1)),
    hedging_rate: roundScore(clamp(hedgingCount / wordCount / 0.12, 0, 1)),
    // Expanded habit signals (schema v2).
    dialogue_rate: roundScore(clamp(dialogueRate / 0.5, 0, 1)),
    all_caps_rate: roundScore(clamp(allCapsCount / wordCount / 0.1, 0, 1)),
    number_rate: roundScore(clamp(numberCount / wordCount / 0.15, 0, 1)),
    url_rate: roundScore(clamp(urlCount / Math.max(sentenceWordCounts.length, 1), 0, 1)),
    emoji_rate: roundScore(clamp(emojiCount / wordCount / 0.1, 0, 1)),
    passive_rate: roundScore(clamp(passiveHintCount / Math.max(sentenceWordCounts.length, 1), 0, 1)),
    // Grammar mistake signals (schema v3).
    comma_splice_rate: roundScore(commaSpliceRate),
    semicolon_spam_rate: roundScore(semicolonSpamRate),
    run_on_sentence_rate: roundScore(runOnSentenceRate),
    // Sentence structure signals (schema v3).
    simple_sentence_rate: roundScore(simpleSentenceRate),
    compound_sentence_rate: roundScore(compoundSentenceRate),
    complex_sentence_rate: roundScore(complexSentenceRate),
    // Punctuation rhythm and quote style.
    punctuation_rhythm: roundScore(punctuationRhythm),
    quote_style: roundScore(quoteStyle),
    frequentWords: frequentWords,
    // Structured habit breakdowns (carried into SVG metadata as-is).
    punctuationBreakdown: {
      comma: commaCount,
      period: periodCount,
      semicolon: semicolonCount,
      colon: colonCount,
      dash: dashCount,
      question: questionCount,
      exclamation: exclamationCount,
      total: punctuationTotal,
      commaShare: roundScore(commaShare),
      varietyScore: roundScore(punctuationVariety)
    },
    vocabularyBreakdown: {
      uniqueWordCount: uniqueWords.size,
      totalWordCount: wordCount,
      typeTokenRatio: roundScore(clamp(uniqueWords.size / wordCount, 0, 1)),
      lexicalDiversity: roundScore(lexicalDiversity / 2.5),
      longWordRate: roundScore(clamp(longWordCount / wordCount * 2, 0, 1)),
      averageWordLength: roundScore(clamp((averageWordLength - 2) / 8, 0, 1))
    },
    readability: {
      fleschKincaidGrade: roundScore(clamp((fleschKincaidGrade + 5) / 15, 0, 1)),
      fleschReadingEase: roundScore(clamp(fleschReadingEase / 100, 0, 1)),
      avgSentenceLength: roundScore(clamp(averageSentenceLength / 50, 0, 1)),
      avgSyllablesPerWord: roundScore(clamp(avgSyllablesPerWord / 3, 0, 1)),
      gradeLabel: gradeLabel
    },
    styleClassification: {
      formalityLevel: formalityLevel,
      dominantMood: dominantMood,
      voice: voice,
      pacing: pacing,
      gradeLabel: gradeLabel
    },
    domain: bestDomain
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

  HABIT_SIGNAL_NAMES.forEach(function(signal) {
    var difference = roundScore(Math.abs(reference[signal] - candidate[signal]));
    differences[signal] = difference;
    similarityTotal += 1 - difference;
  });

  GRAMMAR_SIGNAL_NAMES.forEach(function(signal) {
    var difference = roundScore(Math.abs(reference[signal] - candidate[signal]));
    differences[signal] = difference;
    similarityTotal += 1 - difference;
  });

  SENTENCE_STRUCTURE_NAMES.forEach(function(signal) {
    var difference = roundScore(Math.abs(reference[signal] - candidate[signal]));
    differences[signal] = difference;
    similarityTotal += 1 - difference;
  });

  var referenceWords = new Set(reference.frequentWords.map(function(w) { return typeof w === 'string' ? w : w.word; }));
  var candidateWords = new Set(candidate.frequentWords.map(function(w) { return typeof w === 'string' ? w : w.word; }));
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
      : roundScore(similarityTotal / (STYLE_SIGNAL_NAMES.length + HABIT_SIGNAL_NAMES.length + GRAMMAR_SIGNAL_NAMES.length + SENTENCE_STRUCTURE_NAMES.length + 1)),
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
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Unsupported or invalid WriteLikeMe style profile version.');
  }

  var version = parsed.schemaVersion;
  if (version === 1 || version === 2) {
    // Legacy v1/v2: upgrade to the current shape with defaults for new fields.
    return createStyleProfile(parsed);
  }
  if (version !== SCHEMA_VERSION) {
    throw new Error('Unsupported or invalid WriteLikeMe style profile version.');
  }

  // Validate v2 structure.
  if (
    !parsed.categories ||
    typeof parsed.categories !== 'object' ||
    !parsed.signals ||
    typeof parsed.signals !== 'object' ||
    !Array.isArray(parsed.frequentWords)
  ) {
    throw new Error('Unsupported or invalid WriteLikeMe style profile version.');
  }

  CATEGORY_NAMES.concat(STYLE_SIGNAL_NAMES.filter(function(signal) {
    return CATEGORY_NAMES.indexOf(signal) === -1;
  })).concat(HABIT_SIGNAL_NAMES).concat(GRAMMAR_SIGNAL_NAMES).concat(SENTENCE_STRUCTURE_NAMES).forEach(function(signal) {
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
    .replace(/^(?:please\s+)?(?:write|draft|compose|create|generate)\s+(?:(?:a|an|the)\s+)?(?:(?:short|brief|concise|detailed|thoughtful|clear|simple|professional|friendly)\s+)*(?:[a-z-]+\s+){0,2}?(?:(?:paragraph|essay|article|post|email|message|story|summary|explanation|response|letter|introduction|review|poem|script|update|note|announcement|tweet|thread|bio|description|report|memo|speech|caption|newsletter|readme|section)s?\s+)?(?:(?:to|for)\s+(?:the\s+|my\s+|our\s+)?[a-z-]+\s+)?(?:about|on|regarding|concerning|for)\s+/i, '')
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
  var contractions = signals.contraction_rate >= 0.5;
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
      ? (contractions ? "you'll notice it's" : 'you will notice it is')
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
  return sentences.map(function(sentence) {
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }).join(' ');
};

// Compact, plain-language style brief. Designed to be pasted into an LLM or
// coding agent so it can write in the profile's voice using few tokens.
exports.describeStyle = function(profileInput) {
  var profile = typeof profileInput === 'string'
    ? exports.readStyleCode(profileInput)
    : createStyleProfile(profileInput || {});
  var c = profile.categories;
  var s = profile.signals;
  var cls = profile.styleClassification || {};
  var lines = [];
  function pick(value, high, low, mid) {
    return value >= 0.65 ? high : value <= 0.35 ? low : mid;
  }

  lines.push('Register: ' + pick(c.formality, 'formal and precise', 'casual and conversational', 'neutral, plain-spoken') +
    '; ' + pick(c.tone, 'warm, positive tone', 'restrained or critical tone', 'even tone') + '.');
  lines.push('Sentences: ' + pick(c.sentence_length, 'long', 'short', 'medium-length') +
    (s.sentence_variation >= 0.45 ? ', with varied lengths' : ', fairly uniform') +
    '; ' + pick(c.complexity, 'complex structure and multi-syllable words', 'simple structure and everyday words', 'moderate complexity') + '.');
  var voice = [];
  if (s.first_person >= 0.3) voice.push('speak in first person (I/we)');
  if (s.second_person >= 0.3) voice.push('address the reader as "you"');
  if (!voice.length) voice.push('mostly third person; keep "I" rare');
  voice.push(s.contraction_rate >= 0.5 ? 'use contractions' : s.contraction_rate <= 0.05 ? 'avoid contractions' : 'occasional contractions');
  lines.push('Voice: ' + voice.join('; ') + '.');
  var habits = [];
  if (s.transition_rate >= 0.4) habits.push('signpost with transitions (however, furthermore)');
  if (s.hedging_rate >= 0.3) habits.push('hedge claims (might, probably)');
  if (s.question_rate >= 0.15) habits.push('ask the reader questions');
  if (s.exclamation_rate >= 0.15) habits.push('use exclamation marks');
  if (s.emoji_rate >= 0.2) habits.push('include the odd emoji');
  if (s.passive_rate >= 0.5) habits.push('passive voice is acceptable');
  if (s.dialogue_rate >= 0.3) habits.push('quote dialogue');
  if (c.creativity >= 0.65) habits.push('vivid, figurative wording');
  if (c.vocabulary >= 0.75) habits.push('varied vocabulary, avoid repeating words');
  lines.push('Habits: ' + (habits.length ? habits.join('; ') : 'no strong habits; keep it direct') + '.');
  lines.push('Punctuation: ' + pick(c.punctuation, 'comma-rich, flowing clauses', 'mostly full stops, few commas', 'balanced commas and full stops') +
    (s.semicolon_spam_rate >= 0.5 ? '; semicolons welcome' : '') + '.');
  if (cls.gradeLabel && cls.gradeLabel !== 'standard') {
    lines.push('Reading level: ' + cls.gradeLabel + (profile.domain && profile.domain !== 'general' ? '; ' + profile.domain + ' domain' : '') + '.');
  }
  if (profile.frequentWords && profile.frequentWords.length) {
    lines.push('Signature words: ' + profile.frequentWords.slice(0, 5).map(function(entry) {
      return entry.word;
    }).join(', ') + '.');
  }
  return lines.join('\n');
};

exports.DEFAULT_STYLE_CATEGORIES = DEFAULT_STYLE_CATEGORIES;
exports.HABIT_SIGNAL_NAMES = HABIT_SIGNAL_NAMES;
exports.GRAMMAR_SIGNAL_NAMES = GRAMMAR_SIGNAL_NAMES;
exports.SENTENCE_STRUCTURE_NAMES = SENTENCE_STRUCTURE_NAMES;
exports.SCHEMA_VERSION = SCHEMA_VERSION;
exports.createStyleProfile = createStyleProfile;
return exports;
});
