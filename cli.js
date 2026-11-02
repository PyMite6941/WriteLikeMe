#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const WriteLikeMe = require('./index.js');
const { version } = require('./package.json');

const usage = `WriteLikeMe ${version} - local writing-style analysis and SVG style codes

Usage:
  writelike-me analyze  [text] [-f file] [--brief]
  writelike-me generate [text] [-f file] [-o out.svg] [--width N] [--height N]
  writelike-me brief    --style-code <file.svg>        (or [text] / -f file)
  writelike-me inspect  <file.svg> [--brief]
  writelike-me write    --style-code <file.svg> <prompt>
  writelike-me compare  <reference> <candidate>  |  --reference-file a --candidate-file b
  writelike-me mcp                                     (MCP server over stdio)

Text input: positional words, -f/--file <path>, or "-" to read stdin.
-o/--out writes the SVG to a file and prints one line instead of the markup.
--brief prints a compact summary instead of the full JSON (fewer tokens).`;

const VALUE_FLAGS = {
  '-f': 'file', '--file': 'file',
  '-o': 'out', '--out': 'out',
  '-s': 'styleCode', '--style-code': 'styleCode',
  '--width': 'width', '--height': 'height',
  '--reference-file': 'referenceFile', '--candidate-file': 'candidateFile'
};
const BOOL_FLAGS = { '--brief': 'brief', '--json': 'json' };

class UsageError extends Error {}

function parseArgs(args) {
  const opts = { positional: [] };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const eq = arg.indexOf('=');
    const name = arg.startsWith('--') && eq > 0 ? arg.slice(0, eq) : arg;
    if (VALUE_FLAGS[name]) {
      const value = name !== arg ? arg.slice(eq + 1) : args[++i];
      if (!value) throw new UsageError(`Provide a value after ${name}.`);
      if (opts[VALUE_FLAGS[name]] !== undefined) throw new UsageError(`Provide exactly one value for ${name}.`);
      opts[VALUE_FLAGS[name]] = value;
    } else if (BOOL_FLAGS[arg]) {
      opts[BOOL_FLAGS[arg]] = true;
    } else {
      opts.positional.push(arg);
    }
  }
  return opts;
}

function readInput(opts) {
  if (opts.file) return fs.readFileSync(opts.file, 'utf8');
  if (opts.positional.length === 1 && opts.positional[0] === '-') return fs.readFileSync(0, 'utf8');
  return opts.positional.join(' ');
}

function readSvg(file) {
  return WriteLikeMe.readStyleCode(fs.readFileSync(file, 'utf8'));
}

function briefSummary(profile) {
  return {
    categories: profile.categories,
    styleClassification: profile.styleClassification,
    domain: profile.domain,
    frequentWords: (profile.frequentWords || []).map((entry) => entry.word),
    brief: WriteLikeMe.describeStyle(profile)
  };
}

function size(value, name) {
  if (value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new UsageError(`${name} must be a positive number.`);
  return number;
}

function run(command, args) {
  const opts = parseArgs(args);
  const print = (value) => process.stdout.write((typeof value === 'string' ? value : JSON.stringify(value, null, 2)) + '\n');

  switch (command) {
    case 'analyze': {
      const text = readInput(opts).trim();
      if (!text) throw new UsageError('Please provide text to analyze.');
      const analysis = WriteLikeMe.analyzeText(text);
      return print(opts.brief ? briefSummary(WriteLikeMe.createStyleProfile(analysis)) : analysis);
    }
    case 'generate': {
      const text = readInput(opts).trim();
      const svg = WriteLikeMe.generateStyleSVG(
        text ? WriteLikeMe.analyzeText(text) : undefined,
        size(opts.width, '--width'),
        size(opts.height, '--height')
      );
      if (!opts.out) return print(svg);
      fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
      fs.writeFileSync(opts.out, svg + '\n');
      return print(`Wrote ${opts.out} (${svg.length} bytes)`);
    }
    case 'brief': {
      let profile;
      if (opts.styleCode) profile = readSvg(opts.styleCode);
      else {
        const text = readInput(opts).trim();
        if (!text) throw new UsageError('Provide --style-code <file.svg> or text to describe.');
        profile = WriteLikeMe.analyzeText(text);
      }
      return print(WriteLikeMe.describeStyle(profile));
    }
    case 'inspect': {
      const file = opts.styleCode || opts.file || opts.positional[0];
      if (!file) throw new UsageError('Provide the SVG style code to inspect.');
      const profile = readSvg(file);
      return print(opts.brief ? briefSummary(profile) : profile);
    }
    case 'write': {
      const prompt = (opts.file ? fs.readFileSync(opts.file, 'utf8') : opts.positional.join(' ')).trim();
      if (!opts.styleCode || !prompt) throw new UsageError('Provide a prompt and an SVG file with --style-code.');
      return print(WriteLikeMe.writeLikeMe(prompt, readSvg(opts.styleCode)));
    }
    case 'compare': {
      const reference = opts.referenceFile ? fs.readFileSync(opts.referenceFile, 'utf8') : opts.positional[0];
      const candidate = opts.candidateFile ? fs.readFileSync(opts.candidateFile, 'utf8') : opts.positional[opts.referenceFile ? 0 : 1];
      if (!reference || !candidate) throw new UsageError('Provide a reference and a candidate text (or --reference-file / --candidate-file).');
      const result = WriteLikeMe.compareTextStyle(reference, candidate);
      return print(opts.brief ? { similarity: result.similarity } : result);
    }
    case 'mcp':
      return require('./mcp.js').start();
    default:
      throw new UsageError(`Unknown command: ${command}`);
  }
}

const [command, ...args] = process.argv.slice(2);
if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(usage);
} else if (command === '--version' || command === '-v' || command === 'version') {
  console.log(version);
} else {
  try {
    run(command, args);
  } catch (error) {
    console.error(error instanceof UsageError ? `${error.message}\n\n${usage}` : `writelike-me ${command}: ${error.message}`);
    process.exitCode = 1;
  }
}
