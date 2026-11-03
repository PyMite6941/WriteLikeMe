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
  svg: { type: 'string', description: 'Raw WriteLikeMe SVG markup (prefer style_code_path to save tokens).' }
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
        output_path: { type: 'string', description: 'Where to write the SVG (default: writelikeme-code.svg).' },
        width: { type: 'number' },
        height: { type: 'number' }
      }
    }
  },
  {
    name: 'describe_style',
    description: 'Return a short plain-language style brief (about 100 tokens) from a style code or writing sample. Follow it to write in that voice.',
    inputSchema: {
      type: 'object',
      properties: Object.assign({ text: { type: 'string', description: 'Writing sample (alternative to a style code).' } }, styleSource)
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
  }
];

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

function loadProfile(args, allowText) {
  if (args.style_code_path) return WriteLikeMe.readStyleCode(readFile(args.style_code_path));
  if (args.svg) return WriteLikeMe.readStyleCode(args.svg);
  if (allowText && args.text) return WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText(args.text));
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
    const analysis = WriteLikeMe.analyzeText(readText(args, 'text'));
    return args.full ? analysis : summary(WriteLikeMe.createStyleProfile(analysis));
  },
  generate_style_svg(args) {
    const analysis = WriteLikeMe.analyzeText(readText(args, 'text'));
    const svg = WriteLikeMe.generateStyleSVG(analysis, args.width, args.height);
    const output = path.resolve(args.output_path || 'writelikeme-code.svg');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const contents = svg + '\n';
    fs.writeFileSync(output, contents);
    return { path: output, bytes: Buffer.byteLength(contents), brief: WriteLikeMe.describeStyle(analysis) };
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
  }
};

function handle(message) {
  const { id, method } = message;
  const params = message.params || {};
  switch (method) {
    case 'initialize':
      return {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(params.protocolVersion) ? params.protocolVersion : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: {} },
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
