'use strict';
// Minimal, dependency-free MCP server (JSON-RPC 2.0 over newline-delimited
// stdio). Start with `writelike-me mcp`. Paths resolve against the working
// directory the harness launches the server in. Logs go to stderr only.

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const WriteLikeMe = require('./index.js');
const { version } = require('./package.json');

const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const styleSource = {
  style_code_path: { type: 'string', description: 'Path to a WriteLikeMe SVG style code.' },
  svg: { type: 'string', description: 'Raw WriteLikeMe SVG markup (prefer style_code_path to save tokens).' },
  context: { type: 'string', description: 'Named writing context (email, blog, docs ...). When no style code is given, style/<context>.svg is used.' }
};

const TOOLS = [
  {
    name: 'analyze_text',
    description: 'Analyze a writing sample locally. Returns a compact style summary (categories, classification, brief) unless full=true.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Writing sample. Use text_path for long samples.' },
        text_path: { type: 'string', description: 'Path to a text/markdown file with the sample.' },
        text_paths: { type: 'array', items: { type: 'string' }, description: 'Paths to text/markdown files; they are joined and analyzed as one sample.' },
        full: { type: 'boolean', description: 'Return the full analysis JSON (large).' }
      }
    }
  },
  {
    name: 'generate_style_svg',
    description: 'Create a WriteLikeMe SVG style code from a writing sample and save it to output_path. Returns the path and a style brief, not the SVG markup.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Writing sample.' },
        text_path: { type: 'string', description: 'Path to a file containing the writing sample.' },
        text_paths: { type: 'array', items: { type: 'string' }, description: 'Paths to files containing the writing sample; they are joined into one style code.' },
        output_path: { type: 'string', description: 'Where to write the SVG (default: writelikeme-code.svg).' },
        width: { type: 'number' },
        height: { type: 'number' },
        include_words: { type: 'boolean', description: 'When false, leaves frequent words and signature phrases out of the SVG metadata (default true).' }
      }
    }
  },
  {
    name: 'describe_style',
    description: 'Return a short plain-language style brief (about 100 tokens) from a style code or writing sample. Follow it to write in that voice.',
    inputSchema: {
      type: 'object',
      properties: Object.assign({
        text: { type: 'string', description: 'Writing sample (alternative to a style code).' },
        text_paths: { type: 'array', items: { type: 'string' }, description: 'Paths to writing samples; they are joined and described as one style.' }
      }, styleSource)
    }
  },
  {
    name: 'read_style_code',
    description: 'Read the profile embedded in a WriteLikeMe SVG. Compact summary unless full=true.',
    inputSchema: {
      type: 'object',
      properties: Object.assign({ full: { type: 'boolean' } }, styleSource)
    }
  },
  {
    name: 'compare_styles',
    description: 'Heuristic style similarity (0-1) between a reference sample and a candidate draft, with the largest per-signal differences.',
    inputSchema: {
      type: 'object',
      properties: {
        reference: { type: 'string' }, reference_path: { type: 'string' },
        candidate: { type: 'string' }, candidate_path: { type: 'string' }
      }
    }
  },
  {
    name: 'write_like_me',
    description: 'Deterministic, template-based local draft guided by a style code. Basic output; prefer describe_style and write the text yourself.',
    inputSchema: {
      type: 'object',
      properties: Object.assign({ prompt: { type: 'string' } }, styleSource),
      required: ['prompt']
    }
  },
  {
    name: 'check_draft',
    description: 'Score a draft against a style code (0-1) and list the largest style gaps with short actionable fixes. Returns score, pass flag and up to five issues; never returns SVG markup.',
    inputSchema: {
      type: 'object',
      properties: Object.assign({
        draft: { type: 'string', description: 'Draft text to check. Use draft_path for long drafts.' },
        draft_path: { type: 'string', description: 'Path to a file containing the draft.' },
        min: { type: 'number', description: 'Pass threshold, 0 to 1 (default 0.8).' }
      }, styleSource)
    }
  }
];

const PROMPTS = [
  {
    name: 'write_like_me',
    description: 'Write a draft in the user\'s style. Provide `task` (what to write) and optionally `context` (named writing context). Resolves style/<context>.svg or style/me.svg; when no style code exists, tells the model to generate one first.',
    arguments: [
      { name: 'task', description: 'What to write.', required: true },
      { name: 'context', description: 'Named writing context (email, blog, docs …). Resolves style/<context>.svg, falling back to style/me.svg.' }
    ]
  },
  {
    name: 'check_my_draft',
    description: 'Check a draft against the user\'s style and revise once if it does not pass. Provide `draft` and optionally `context`.',
    arguments: [
      { name: 'draft', description: 'Draft text to check.', required: true },
      { name: 'context', description: 'Named writing context (email, blog, docs …). Resolves style/<context>.svg, falling back to style/me.svg.' }
    ]
  }
];

function styleCandidates(context) {
  var candidates = [];
  if (typeof context === 'string' && context.trim()) {
    candidates.push(path.join('style', context + '.svg'));
  }
  candidates.push('style/me.svg');
  return candidates;
}

function resolveStyleFile(context) {
  var candidates = styleCandidates(context);
  for (var i = 0; i < candidates.length; i++) {
    var file = candidates[i];
    try {
      return { file: file, profile: WriteLikeMe.readStyleCode(readFile(file)) };
    } catch (error) {
      if (typeof error.message !== 'string' || error.message.indexOf('file not found') < 0) throw error;
    }
  }
  return { file: null };
}

function readFile(file) {
  const resolved = path.resolve(file);
  try {
    return fs.readFileSync(resolved, 'utf8');
  } catch (error) {
    throw new Error(`Could not read ${resolved}: ${error.code === 'ENOENT' ? 'file not found' : error.message}`);
  }
}

function readText(args, key) {
  if (args[key + '_path']) return readFile(args[key + '_path']);
  if (typeof args[key] === 'string' && args[key].trim()) return args[key];
  throw new Error(`Provide ${key} or ${key}_path.`);
}

function readTexts(args, key) {
  var paths = args[key];
  if (!Array.isArray(paths) || paths.length === 0) return null;
  return paths.map(function(p) { return readFile(p); }).join('\n\n');
}

function loadProfile(args, allowText) {
  if (args.style_code_path) return WriteLikeMe.readStyleCode(readFile(args.style_code_path));
  if (args.svg) return WriteLikeMe.readStyleCode(args.svg);
  if (args.context) {
    var contextPath = path.join('style', args.context + '.svg');
    try {
      return WriteLikeMe.readStyleCode(readFile(contextPath));
    } catch (error) {
      throw new Error('Could not read style context file ' + contextPath + ': ' + (error.code === 'ENOENT' ? 'file not found' : error.message));
    }
  }
  if (allowText) {
    if (args.text_paths) return WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText(readTexts(args, 'text_paths')));
    if (args.text) return WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText(args.text));
  }
  throw new Error('Provide style_code_path or svg' + (allowText ? ', or text.' : '.'));
}

function summary(profile) {
  return {
    categories: profile.categories,
    styleClassification: profile.styleClassification,
    domain: profile.domain,
    frequentWords: (profile.frequentWords || []).map((entry) => entry.word),
    brief: WriteLikeMe.describeStyle(profile)
  };
}

const HANDLERS = {
  analyze_text(args) {
    var text = readTexts(args, 'text_paths');
    if (text === null) text = readText(args, 'text');
    const analysis = WriteLikeMe.analyzeText(text);
    return args.full ? analysis : summary(WriteLikeMe.createStyleProfile(analysis));
  },
  generate_style_svg(args) {
    var text = readTexts(args, 'text_paths');
    if (text === null) text = readText(args, 'text');
    const analysis = WriteLikeMe.analyzeText(text);
    if (args.context) analysis.context = args.context;
    const svg = WriteLikeMe.generateStyleSVG(analysis, args.width, args.height, args.include_words === false ? { includeWords: false } : undefined);
    var output = args.output_path;
    if (!output && args.context) output = 'style/' + args.context + '.svg';
    const resolved = path.resolve(output || 'writelikeme-code.svg');
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    const contents = svg + '\n';
    fs.writeFileSync(resolved, contents);
    return { path: resolved, bytes: Buffer.byteLength(contents), brief: WriteLikeMe.describeStyle(analysis) };
  },
  describe_style(args) {
    return WriteLikeMe.describeStyle(loadProfile(args, true));
  },
  read_style_code(args) {
    const profile = loadProfile(args, false);
    return args.full ? profile : summary(profile);
  },
  compare_styles(args) {
    const result = WriteLikeMe.compareTextStyle(readText(args, 'reference'), readText(args, 'candidate'));
    if (!result.differences || typeof result.differences !== 'object') return result;
    const top = Object.keys(result.differences)
      .map((key) => [key, result.differences[key]])
      .filter((entry) => typeof entry[1] === 'number')
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 6);
    return { similarity: result.similarity, largestDifferences: Object.fromEntries(top) };
  },
  write_like_me(args) {
    if (!args.prompt || !String(args.prompt).trim()) throw new Error('Provide a prompt.');
    return WriteLikeMe.writeLikeMe(String(args.prompt), loadProfile(args, false));
  },
  check_draft(args) {
    var draft = args.draft_path ? readFile(args.draft_path) : args.draft;
    if (typeof draft !== 'string' || !draft.trim()) throw new Error('Provide draft or draft_path.');
    return WriteLikeMe.checkDraft(loadProfile(args, false), draft, { min: args.min });
  }
};

function promptWriteLikeMe(args, resolved) {
  var task = typeof args.task === 'string' ? args.task : '';
  var instruction = 'Write the following in that style. Match the voice, not the topic: ' + task;
  if (resolved.profile) {
    var brief = WriteLikeMe.describeStyle(resolved.profile);
    var head = resolved.profile.context ? '' : 'My writing style brief:\n';
    return head + brief + '\n\nDo not call any tools (the write_like_me tool only makes a basic template draft). ' + instruction;
  }
  return 'No style code found at ' + styleCandidates(args.context).join(' or ') +
    '. Call generate_style_svg with a writing sample (text or text_path) to create one, then call describe_style with style_code_path, and finally write: ' + task + '.';
}

function promptCheckMyDraft(args, resolved) {
  var styleRef = resolved.file || 'style/me.svg';
  var draft = typeof args.draft === 'string' ? args.draft : '';
  return 'Check the draft below against my writing style using the writelikeme check_draft tool with style_code_path "' +
    styleRef + '" and draft equal to the text below. If it does not pass (score below 0.8), revise once using the listed fixes and tell me the final score.\n\nDraft:\n' + draft;
}

function promptsGet(params) {
  params = params || {};
  var name = params.name;
  var args = params.arguments || {};
  var prompt = null;
  for (var i = 0; i < PROMPTS.length; i++) {
    if (PROMPTS[i].name === name) { prompt = PROMPTS[i]; break; }
  }
  if (!prompt) throw Object.assign(new Error('Unknown prompt: ' + name), { code: -32602 });
  var required = (prompt.arguments || []).filter(function(a) { return a.required === true; });
  for (var i = 0; i < required.length; i++) {
    if (args[required[i].name] === undefined) {
      throw Object.assign(new Error('Missing required argument: ' + required[i].name), { code: -32602 });
    }
  }
  var resolved = resolveStyleFile(args.context);
  var text = name === 'write_like_me'
    ? promptWriteLikeMe(args, resolved)
    : promptCheckMyDraft(args, resolved);
  return {
    messages: [
      { role: 'user', content: { type: 'text', text: text } }
    ]
  };
}

function handle(message) {
  const { id, method } = message;
  const params = message.params || {};
  switch (method) {
    case 'initialize':
      return {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(params.protocolVersion) ? params.protocolVersion : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: {}, prompts: {} },
        serverInfo: { name: 'writelikeme', version },
        instructions: 'Local writing-style tools. To write like the user: generate_style_svg (or use an existing .svg), then describe_style, then write the text yourself following the brief.'
      };
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: TOOLS };
    case 'tools/call': {
      const handler = HANDLERS[params.name];
      if (!handler) throw Object.assign(new Error(`Unknown tool: ${params.name}`), { code: -32602 });
      try {
        const result = handler(params.arguments || {});
        return { content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: error.message }], isError: true };
      }
    }
    case 'prompts/list':
      return { prompts: PROMPTS };
    case 'prompts/get':
      return promptsGet(params);
    default:
      if (id === undefined) return undefined; // notification
      throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
  }
}

function start(input = process.stdin, output = process.stdout) {
  const send = (payload) => output.write(JSON.stringify(payload) + '\n');
  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  lines.on('line', (line) => {
    if (!line.trim()) return;
    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
    const isObject = message !== null && typeof message === 'object' && !Array.isArray(message);
    if (!isObject || typeof message.method !== 'string') {
      const id = isObject && message.id !== undefined ? message.id : null;
      return send({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } });
    }
    if (message.id === undefined || message.id === null) {
      try { handle(message); } catch (error) { /* notifications never get replies */ }
      return;
    }
    try {
      send({ jsonrpc: '2.0', id: message.id, result: handle(message) });
    } catch (error) {
      send({ jsonrpc: '2.0', id: message.id, error: { code: error.code || -32603, message: error.message } });
    }
  });
  return lines;
}

module.exports = { start, handle, TOOLS };
