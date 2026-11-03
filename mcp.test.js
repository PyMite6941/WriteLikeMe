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
r = cli('generate', 'Short sample text.', '--width', '400', '--height', '300');
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /^<svg\b[^>]*width="400" height="300"/);
r = cli('brief', '-');
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /^Register:/);
const candidatePath = path.join(dir, 'candidate.txt');
fs.writeFileSync(candidatePath, 'The committee determined the results.');
r = cli('compare', '--reference-file', samplePath, '--candidate-file', candidatePath);
assert.equal(r.status, 0, r.stderr);
assert.ok(JSON.parse(r.stdout).similarity < 1);
r = cli('compare', 'only one text');
assert.equal(r.status, 1);
r = cli('bogus');
assert.equal(r.status, 1);
assert.match(r.stderr, /Unknown command/);
r = cli('--help');
assert.equal(r.status, 0);
assert.match(r.stdout, /writelike-me mcp/);
r = cli('--version');
assert.equal(r.stdout.trim(), require('./package.json').version);
console.log('CLI agent commands verified.');

// --- MCP over stdio ---
const server = spawn(process.execPath, ['cli.js', 'mcp'], { cwd: __dirname });
const pending = new Map();
const nullReplies = [];
const raw = (line) => new Promise((resolve) => {
  nullReplies.push(resolve);
  server.stdin.write(line + '\n');
});
let buffer = '';
server.stdout.on('data', (chunk) => {
  buffer += chunk;
  let index;
  while ((index = buffer.indexOf('\n')) >= 0) {
    const message = JSON.parse(buffer.slice(0, index));
    buffer = buffer.slice(index + 1);
    if (message.id === null) nullReplies.shift()(message);
    else pending.get(message.id)(message);
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

  // Protocol edge cases: the server must never crash on bad input.
  const fallback = await rpc('initialize', { protocolVersion: '1999-01-01', capabilities: {} });
  assert.equal(fallback.result.protocolVersion, '2025-06-18', 'unknown protocol falls back to latest supported');
  assert.deepEqual((await rpc('ping', {})).result, {});
  assert.equal((await raw('not json')).error.code, -32700);
  assert.equal((await raw('null')).error.code, -32600);
  assert.equal((await raw('[]')).error.code, -32600);
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/cancelled', params: {} }) + '\n');
  const afterNotification = await rpc('ping', {});
  assert.deepEqual(afterNotification.result, {}, 'notifications get no reply and do not desync ids');

  // Tool edge cases.
  res = await call('generate_style_svg', { text: sample, output_path: mcpSvg, width: 400, height: 300 });
  const generated = JSON.parse(res.content[0].text);
  assert.equal(generated.bytes, fs.statSync(mcpSvg).size, 'reported bytes match the file');
  assert.match(fs.readFileSync(mcpSvg, 'utf8'), /width="400" height="300"/);
  res = await call('describe_style', { svg: fs.readFileSync(mcpSvg, 'utf8') });
  assert.match(res.content[0].text, /^Register:/);
  res = await call('describe_style', { text: sample });
  assert.match(res.content[0].text, /^Register:/);
  res = await call('read_style_code', { style_code_path: mcpSvg, full: true });
  assert.equal(JSON.parse(res.content[0].text).schemaVersion, 3);
  res = await call('analyze_text', { text_path: samplePath, full: true });
  assert.ok(JSON.parse(res.content[0].text).wordCount > 0);
  res = await call('compare_styles', { reference_path: samplePath, candidate_path: candidatePath });
  assert.ok(Object.keys(JSON.parse(res.content[0].text).largestDifferences).length <= 6);
  res = await call('write_like_me', { prompt: '  ', style_code_path: mcpSvg });
  assert.equal(res.isError, true);
  res = await call('read_style_code', { svg: '<svg></svg>' });
  assert.equal(res.isError, true);
  res = await call('describe_style', { style_code_path: path.join(dir, 'missing.svg') });
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /^Could not read .*missing.svg: file not found$/);
  res = await call('analyze_text', { text: '   ' });
  assert.equal(res.isError, true);

  server.kill();

  // Relative paths and the default output file resolve against the server's working directory.
  const projectServer = spawn(process.execPath, [path.join(__dirname, 'cli.js'), 'mcp'], { cwd: dir });
  const projectReply = new Promise((resolve) => {
    let text = '';
    projectServer.stdout.on('data', (chunk) => {
      text += chunk;
      if (text.includes('\n')) resolve(JSON.parse(text.split('\n')[0]));
    });
  });
  projectServer.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'generate_style_svg', arguments: { text_path: 'sample.txt' } } }) + '\n');
  const projectResult = await projectReply;
  const projectExited = new Promise((resolve) => projectServer.on('exit', resolve));
  projectServer.kill();
  await projectExited; // Windows can't delete a directory a live process is using.
  assert.ok(!projectResult.result.isError, projectResult.result.content[0].text);
  assert.ok(fs.existsSync(path.join(dir, 'writelikeme-code.svg')), 'default output_path is in the working directory');

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('MCP server verified (protocol, 6 tools, edge cases, relative paths).');
})().catch((error) => {
  server.kill();
  console.error(error);
  process.exit(1);
});
