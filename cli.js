#!/usr/bin/env node
'use strict';

const WriteLikeMe = require('./index.js');
const fs = require('fs');

const [command, ...args] = process.argv.slice(2);
const usage = [
  'Usage:',
  '  writelike-me analyze <text>',
  '  writelike-me generate [text]',
  '  writelike-me write --style-code <file.svg> <prompt>',
  '',
  'Analyze text as JSON, generate a style SVG, or write a local draft using',
  'the profile embedded in a shared WriteLikeMe SVG style code.'
].join('\n');

if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log(usage);
} else if (command === 'analyze' || command === 'generate') {
  const text = args.join(' ').trim();

  if (command === 'analyze' && !text) {
    console.error('Please provide text to analyze.\n\n' + usage);
    process.exitCode = 1;
  } else if (command === 'analyze') {
    console.log(JSON.stringify(WriteLikeMe.analyzeText(text), null, 2));
  } else {
    const profile = text ? WriteLikeMe.analyzeText(text) : undefined;
    process.stdout.write(WriteLikeMe.generateStyleSVG(profile) + '\n');
  }
} else if (command === 'write') {
  let styleCodePath;
  const promptParts = [];

  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--style-code') {
      if (styleCodePath || !args[index + 1]) {
        console.error('Provide exactly one file path after --style-code.\n\n' + usage);
        process.exitCode = 1;
        break;
      }
      styleCodePath = args[++index];
    } else if (args[index].startsWith('--style-code=')) {
      if (styleCodePath || args[index].length === '--style-code='.length) {
        console.error('Provide exactly one file path after --style-code.\n\n' + usage);
        process.exitCode = 1;
        break;
      }
      styleCodePath = args[index].slice('--style-code='.length);
    } else {
      promptParts.push(args[index]);
    }
  }

  if (!process.exitCode) {
    const prompt = promptParts.join(' ').trim();
    if (!styleCodePath || !prompt) {
      console.error('Provide a prompt and an SVG file with --style-code.\n\n' + usage);
      process.exitCode = 1;
    } else {
      try {
        const svg = fs.readFileSync(styleCodePath, 'utf8');
        process.stdout.write(WriteLikeMe.writeLikeMe(prompt, svg) + '\n');
      } catch (error) {
        console.error('Unable to write from the supplied style code: ' + error.message);
        process.exitCode = 1;
      }
    }
  }
} else {
  console.error('Unknown command: ' + command + '\n\n' + usage);
  process.exitCode = 1;
}
