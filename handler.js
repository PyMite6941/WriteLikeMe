(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./index.js'));
  } else {
    root.WriteLikeMeHandler = factory(root.WriteLikeMe);
  }
})(typeof globalThis === 'object' ? globalThis : this, function(WriteLikeMe) {
// WriteLikeMe Handler - connection-based interface for agents.
// Wraps the local WriteLikeMe library so an agent can connect to a style
// profile, analyze text, generate shareable SVG style codes, write local
// drafts, and exchange profiles with other agents. No network calls are made.

var fs;
try {
  fs = require('fs');
} catch (error) {
  fs = null;
}

var DEFAULT_WIDTH = 320;
var DEFAULT_HEIGHT = 320;

function isString(value) {
  return typeof value === 'string';
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneProfile(profile) {
  if (!isObject(profile)) {
    return {};
  }
  return JSON.parse(JSON.stringify(profile));
}

function loadStyleCode(styleCode) {
  // Accepts an SVG string, a profile object, or (in Node) a file path to an SVG.
  if (isString(styleCode)) {
    if (/<svg\b/i.test(styleCode)) {
      return WriteLikeMe.readStyleCode(styleCode);
    }
    if (fs && styleCode.length > 0 && styleCode.indexOf('<') === -1) {
      var svg;
      try {
        svg = fs.readFileSync(styleCode, 'utf8');
      } catch (error) {
        throw new Error('Could not read style code file "' + styleCode + '": ' + error.message);
      }
      return WriteLikeMe.readStyleCode(svg);
    }
    // Non-SVG string: not a valid style code source.
    throw new TypeError('Style code must be an SVG string, a profile object, or a file path to an SVG.');
  }
  if (isObject(styleCode)) {
    return WriteLikeMe.createStyleProfile(styleCode);
  }
  if (styleCode === undefined || styleCode === null) {
    return WriteLikeMe.createStyleProfile({});
  }
  throw new TypeError('Style code must be an SVG string, a profile object, or a file path to an SVG.');
}

function Handler(options) {
  this.options = options && isObject(options) ? options : {};
  this.profile = WriteLikeMe.createStyleProfile({});
  this.source = null;
  this.connected = false;
}

Handler.prototype.isConnected = function() {
  return this.connected;
};

Handler.prototype.snapshot = function() {
  return {
    connected: this.connected,
    source: this.source,
    profile: cloneProfile(this.profile),
    options: cloneProfile(this.options)
  };
};

Handler.prototype.connect = function(styleCode) {
  this.profile = loadStyleCode(styleCode);
  this.source = isString(styleCode) ? styleCode : 'object';
  this.connected = true;
  return this.snapshot();
};

Handler.prototype.connectFromFile = function(filePath) {
  if (!fs) {
    throw new Error('File system access is not available in this environment.');
  }
  if (!isString(filePath) || filePath.length === 0) {
    throw new TypeError('File path must be a non-empty string.');
  }
  var svg = fs.readFileSync(filePath, 'utf8');
  this.profile = WriteLikeMe.readStyleCode(svg);
  this.source = filePath;
  this.connected = true;
  return this.snapshot();
};

Handler.prototype.analyze = function(text) {
  if (!isString(text)) {
    throw new TypeError('Text must be a string.');
  }
  return WriteLikeMe.analyzeText(text);
};

Handler.prototype.generateSVG = function(cats, width, height) {
  // Keep the full connected profile (signals, frequent words) in the SVG
  // metadata; category overrides are merged on top.
  var input = cloneProfile(this.profile);
  if (cats && isObject(cats)) {
    var overrides = isObject(cats.categories) ? cats.categories : cats;
    input.categories = Object.assign({}, input.categories, overrides);
  }
  var w = width || DEFAULT_WIDTH;
  var h = height || DEFAULT_HEIGHT;
  return WriteLikeMe.generateStyleSVG(input, w, h);
};

Handler.prototype.write = function(prompt) {
  if (!this.connected) {
    throw new Error('Handler is not connected to a style profile. Call connect() first.');
  }
  if (!isString(prompt) || prompt.trim().length === 0) {
    throw new TypeError('Prompt must be a non-empty string.');
  }
  return WriteLikeMe.writeLikeMe(prompt, this.profile);
};

Handler.prototype.compare = function(referenceText, candidateText) {
  if (!isString(referenceText) || !isString(candidateText)) {
    throw new TypeError('Both texts must be strings.');
  }
  return WriteLikeMe.compareTextStyle(referenceText, candidateText);
};

Handler.prototype.share = function() {
  // Export a portable, versioned profile that another agent can import.
  return {
    format: 'writelikeme-profile',
    version: 1,
    profile: cloneProfile(this.profile),
    connected: this.connected,
    source: this.source
  };
};

Handler.prototype.import = function(sharedProfile) {
  if (!isObject(sharedProfile) || !isObject(sharedProfile.profile)) {
    throw new TypeError('Shared profile must be an object containing a profile.');
  }
  this.profile = WriteLikeMe.createStyleProfile(sharedProfile.profile);
  this.source = sharedProfile.source || 'shared';
  this.connected = true;
  return this.snapshot();
};

Handler.prototype.exportToFile = function(filePath) {
  if (!fs) {
    throw new Error('File system access is not available in this environment.');
  }
  if (!isString(filePath) || filePath.length === 0) {
    throw new TypeError('File path must be a non-empty string.');
  }
  fs.writeFileSync(filePath, JSON.stringify(this.share(), null, 2), 'utf8');
  return filePath;
};

Handler.prototype.importFromFile = function(filePath) {
  if (!fs) {
    throw new Error('File system access is not available in this environment.');
  }
  if (!isString(filePath) || filePath.length === 0) {
    throw new TypeError('File path must be a non-empty string.');
  }
  var data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return this.import(data);
};

Handler.prototype.reset = function() {
  this.profile = WriteLikeMe.createStyleProfile({});
  this.source = null;
  this.connected = false;
  return this.snapshot();
};

return { Handler: Handler, createHandler: function(options) { return new Handler(options); } };
});
