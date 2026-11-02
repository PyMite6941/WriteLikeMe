// End-to-end tests for the MCP server (real stdio process) and agent-facing CLI commands.
const assert = require('assert');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const WriteLikeMe = require('./index.js');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'writelikeme-'));
const sample = "Honestly, I can't believe how fast this went! We tried it, and you'd love it. Why not? It's fun.";
const samplePath = path.join(dir, 'sample.txt');
fs.writeFileSync(samplePath, sample);
const cli = (...args) => spawnSync(process.execPath, ['cli.js', ...args], { encoding: 'utf8', input: sample });

// --- CLI ---
const outSvg = path.join(dir, 'nested', 'me.svg');
let r = cli('generate', '-f', samplePath, '-o', outSvg);
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /^Wrote .*me\.svg \(\d+ bytes\)\n$/);
assert.equal(WriteLikeMe.readStyleCode(fs.readFileSync(outSvg, 'utf8')).categories.formality,
  WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText(sample)).categories.formality);

r = cli('analyze', '-');
assert.equal(r.status, 0, r.stderr);
assert.equal(JSON.parse(r.stdout).wordCount, WriteLikeMe.analyzeText(sample).wordCount);

r = cli('analyze', '--brief', sample);
assert.equal(r.status, 0, r.stderr);
assert.ok(JSON.parse(r.stdout).brief.includes('Voice:'));

r = cli('brief', '--style-code', outSvg);
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /^Register: .*contractions/s);
assert.ok(r.stdout.length < 800, 'brief stays compact');

r = cli('inspect', outSvg, '--brief');
assert.equal(r.status, 0, r.stderr);
assert.ok(JSON.parse(r.stdout).categories);

r = cli('compare', '--brief', 'I love this!', 'The committee determined the results.');
assert.equal(r.status, 0, r.stderr);
assert.ok(JSON.parse(r.stdout).similarity <= 1);

r = cli('write', '--style-code=' + outSvg, 'Write about gardens.');
assert.equal(r.status, 0, r.stderr);
assert.ok(r.stdout.trim().length > 0);

r = cli('generate', '--width', 'abc');
assert.equal(r.status, 1);
r = cli('inspect', path.join(dir, 'missing.svg'));
assert.equal(r.status, 1);
assert.match(r.stderr, /inspect/);
r = cli('--version');
assert.equal(r.stdout.trim(), require('./package.json').version);
console.log('CLI agent commands verified.');

// --- MCP over stdio ---
const server = spawn(process.execPath, ['cli.js', 'mcp'], { cwd: __dirname });
const pending = new Map();
let buffer = '';
server.stdout.on('data', (chunk) => {
  buffer += chunk;
  let index;
  while ((index = buffer.indexOf('\n')) >= 0) {
    const message = JSON.parse(buffer.slice(0, index));
    buffer = buffer.slice(index + 1);
    pending.get(message.id)(message);
  }
});
let nextId = 1;
const rpc = (method, params) => new Promise((resolve) => {
  const id = nextId++;
  pending.set(id, resolve);
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
});
const call = async (name, args) => {
  const res = await rpc('tools/call', { name, arguments: args });
  return res.result;
};

(async () => {
  const init = await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '0' } });
  assert.equal(init.result.protocolVersion, '2025-03-26');
  assert.equal(init.result.serverInfo.name, 'writelikeme');
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  const list = await rpc('tools/list', {});
  assert.deepEqual(list.result.tools.map((tool) => tool.name).sort(),
    ['analyze_text', 'compare_styles', 'describe_style', 'generate_style_svg', 'read_style_code', 'write_like_me']);

  const mcpSvg = path.join(dir, 'mcp.svg');
  let res = await call('generate_style_svg', { text_path: samplePath, output_path: mcpSvg });
  assert.ok(!res.isError, res.content[0].text);
  assert.ok(fs.existsSync(mcpSvg));
  assert.ok(!res.content[0].text.includes('<svg'), 'SVG markup is not returned to the model');

  res = await call('describe_style', { style_code_path: mcpSvg });
  assert.match(res.content[0].text, /^Register:/);
  res = await call('read_style_code', { style_code_path: mcpSvg });
  assert.ok(JSON.parse(res.content[0].text).brief);
  res = await call('analyze_text', { text: sample });
  assert.ok(JSON.parse(res.content[0].text).categories);
  res = await call('compare_styles', { reference: sample, candidate: 'The committee determined the results.' });
  assert.ok(JSON.parse(res.content[0].text).similarity >= 0);
  res = await call('write_like_me', { prompt: 'Write about gardens.', style_code_path: mcpSvg });
  assert.ok(!res.isError && res.content[0].text.length > 0);

  res = await call('describe_style', {});
  assert.equal(res.isError, true);
  const unknown = await rpc('tools/call', { name: 'nope', arguments: {} });
  assert.equal(unknown.error.code, -32602);
  const missing = await rpc('does/not/exist', {});
  assert.equal(missing.error.code, -32601);

  server.kill();
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('MCP server verified (initialize, tools/list, 6 tools, errors).');
})().catch((error) => {
  server.kill();
  console.error(error);
  process.exit(1);
});
