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

// Repeated -f, directories and --no-words.
const multiDir = path.join(dir, 'multi');
fs.mkdirSync(multiDir, { recursive: true });
fs.writeFileSync(path.join(multiDir, 'a.md'), '# Hello there\nThis is a markdown file about writing style.');
fs.writeFileSync(path.join(multiDir, 'b.txt'), 'Plain text file. It mentions apples and oranges.');
fs.writeFileSync(path.join(multiDir, 'c.markdown'), 'More markdown text about apples and writing.');
fs.writeFileSync(path.join(multiDir, 'ignored.js'), 'const x = 1;');

r = cli('analyze', '-f', path.join(multiDir, 'a.md'), '-f', path.join(multiDir, 'b.txt'));
assert.equal(r.status, 0, r.stderr);
const multi = JSON.parse(r.stdout);
assert.equal(multi.wordCount, WriteLikeMe.analyzeText(fs.readFileSync(path.join(multiDir, 'a.md'), 'utf8') + '\n\n' + fs.readFileSync(path.join(multiDir, 'b.txt'), 'utf8')).wordCount);

r = cli('generate', '-f', multiDir, '-o', path.join(dir, 'from-dir.svg'));
assert.equal(r.status, 0, r.stderr);
assert.ok(WriteLikeMe.readStyleCode(fs.readFileSync(path.join(dir, 'from-dir.svg'), 'utf8')).categories);

r = cli('brief', '-f', multiDir);
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /^Register:/);

r = cli('generate', '-f', path.join(multiDir, 'a.md'), '-o', path.join(dir, 'no-words.svg'), '--no-words');
assert.equal(r.status, 0, r.stderr);
assert.equal(WriteLikeMe.readStyleCode(fs.readFileSync(path.join(dir, 'no-words.svg'), 'utf8')).frequentWords.length, 0);
console.log('CLI accepts repeated -f, directories of .md/.txt/.markdown, and generate --no-words.');

// CLI check command: pass, fail (exit 1), and --json.
const checkSvg = path.join(dir, 'check.svg');
fs.writeFileSync(checkSvg, WriteLikeMe.generateStyleSVG(WriteLikeMe.analyzeText('I think it is simple. You build it, you ship it. That is it.')));
r = cli('check', '--style-code', checkSvg, 'I think it is simple. You build it, you ship it.');
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout, /^Score [0-9.]+ \(pass\)/);
assert.match(r.stdout, /^- /m, 'check prints one fix line per issue');
r = cli('check', '--style-code', checkSvg, 'Furthermore, a comprehensive evaluation is necessary; the optimal recommendation should be implemented immediately!', '--min', '0.99');
assert.equal(r.status, 1, 'check exits 1 when score is below --min');
r = cli('check', '--style-code', checkSvg, 'I think it is simple.', '--json');
assert.equal(r.status, 0, r.stderr);
const checkJson = JSON.parse(r.stdout);
assert.ok(typeof checkJson.score === 'number' && checkJson.pass !== undefined && Array.isArray(checkJson.issues), '--json prints the check object');
assert.ok(checkJson.issues.every(function(issue) { return issue.signal && typeof issue.fix === 'string'; }));

// generate --context defaults output to style/<context>.svg when -o is omitted.
r = cli('generate', 'A short context sample about writing.', '--context', 'email');
assert.equal(r.status, 0, r.stderr);
assert.match(r.stdout.trim(), /^Wrote style\/email\.svg \(\d+ bytes\)$/);
var contextSvg = path.join(__dirname, 'style', 'email.svg');
assert.ok(fs.existsSync(contextSvg), 'style/email.svg written next to the package');
assert.equal(WriteLikeMe.readStyleCode(fs.readFileSync(contextSvg, 'utf8')).context, 'email', 'context stored in the SVG');
fs.unlinkSync(contextSvg);

// generate --context with an explicit -o still uses -o.
r = cli('generate', 'Another sample.', '--context', 'blog', '-o', path.join(dir, 'blog.svg'));
assert.equal(r.status, 0, r.stderr);
assert.equal(WriteLikeMe.readStyleCode(fs.readFileSync(path.join(dir, 'blog.svg'), 'utf8')).context, 'blog');

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
    ['analyze_text', 'check_draft', 'compare_styles', 'describe_style', 'generate_style_svg', 'read_style_code', 'write_like_me']);

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

  // check_draft: compact score/pass/issues, never SVG markup.
  res = await call('check_draft', { draft: 'I think it is simple. You build it, you ship it.', style_code_path: mcpSvg });
  assert.ok(!res.isError, res.content[0].text);
  var checkResult = JSON.parse(res.content[0].text);
  assert.ok(typeof checkResult.score === 'number' && checkResult.score >= 0 && checkResult.score <= 1);
  assert.ok(checkResult.pass !== undefined);
  assert.ok(Array.isArray(checkResult.issues) && checkResult.issues.length <= 5);
  assert.ok(checkResult.issues.every(function(i) {
    return i.signal && typeof i.yours === 'number' && typeof i.draft === 'number' && typeof i.fix === 'string';
  }));
  assert.ok(!res.content[0].text.includes('<svg'), 'check_draft never returns SVG markup');

  // check_draft via draft_path and an explicit min.
  const checkDraftPath = path.join(dir, 'draft.txt');
  fs.writeFileSync(checkDraftPath, 'I think it is simple. You build it, you ship it.');
  res = await call('check_draft', { draft_path: checkDraftPath, style_code_path: mcpSvg, min: 0.5 });
  assert.ok(!res.isError, res.content[0].text);
  assert.equal(JSON.parse(res.content[0].text).pass, true);

  // check_draft missing draft and missing style code both error.
  res = await call('check_draft', { draft: '', style_code_path: mcpSvg });
  assert.equal(res.isError, true);
  res = await call('check_draft', { draft: 'some text' });
  assert.equal(res.isError, true);

  // describe_style with context resolves style/<context>.svg when no style code is given.
  var ctxSvgPath = path.join(__dirname, 'style', 'email.svg');
  fs.writeFileSync(ctxSvgPath, WriteLikeMe.generateStyleSVG(Object.assign(WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText('I write short casual notes. You will like them.')), { context: 'email' })));
  try {
    res = await call('describe_style', { context: 'email' });
    assert.ok(!res.isError, res.content[0].text);
    assert.match(res.content[0].text, /^Context: email\./);
  } finally {
    if (fs.existsSync(ctxSvgPath)) fs.unlinkSync(ctxSvgPath);
  }

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

  // Multiple samples via text_paths, and the include_words privacy flag.
  res = await call('analyze_text', { text_paths: [samplePath] });
  assert.ok(!res.isError, res.content[0].text);
  assert.ok(JSON.parse(res.content[0].text).categories);
  const multiSvg = path.join(dir, 'multi.svg');
  res = await call('generate_style_svg', { text_paths: [samplePath, candidatePath], output_path: multiSvg });
  assert.ok(!res.isError, res.content[0].text);
  assert.ok(fs.existsSync(multiSvg));
  res = await call('describe_style', { text_paths: [samplePath] });
  assert.ok(!res.isError, res.content[0].text);
  assert.match(res.content[0].text, /^Register:/);
  const privateSvg = path.join(dir, 'private.svg');
  res = await call('generate_style_svg', { text_paths: [samplePath], output_path: privateSvg, include_words: false });
  assert.ok(!res.isError, res.content[0].text);
  assert.equal(WriteLikeMe.readStyleCode(fs.readFileSync(privateSvg, 'utf8')).frequentWords.length, 0, 'include_words:false empties frequent words in the SVG');
  const defaultSvg = path.join(dir, 'default.svg');
  res = await call('generate_style_svg', { text_paths: [samplePath], output_path: defaultSvg });
  assert.ok(!res.isError, res.content[0].text);
  assert.ok(WriteLikeMe.readStyleCode(fs.readFileSync(defaultSvg, 'utf8')).frequentWords.length > 0, 'frequent words kept by default');

  // --- MCP prompts over stdio ---
  const listed = await rpc('prompts/list', {});
  assert.deepEqual(listed.result.prompts.map(function(p) { return p.name; }).sort(),
    ['check_my_draft', 'write_like_me']);
  const writePrompt = listed.result.prompts.find(function(p) { return p.name === 'write_like_me'; });
  assert.ok(writePrompt.description);
  assert.ok(writePrompt.arguments.some(function(a) { return a.name === 'task' && a.required === true; }));
  assert.ok(writePrompt.arguments.some(function(a) { return a.name === 'context' && !a.required; }));
  const checkPrompt = listed.result.prompts.find(function(p) { return p.name === 'check_my_draft'; });
  assert.ok(checkPrompt.arguments.some(function(a) { return a.name === 'draft' && a.required === true; }));

  // write_like_me with an existing style file: brief + instruction.
  fs.writeFileSync(path.join(__dirname, 'style', 'me.svg'),
    WriteLikeMe.generateStyleSVG(WriteLikeMe.analyzeText('I write short casual notes. You will like them.')));
  try {
    const got = await rpc('prompts/get', { name: 'write_like_me', arguments: { task: 'a thank-you note' } });
    assert.ok(!got.error, JSON.stringify(got.error));
    var text = got.result.messages[0].content.text;
    assert.match(text, /^My writing style brief:\nRegister:/);
    assert.ok(text.includes('Do not call any tools') && text.endsWith(': a thank-you note'));
  } finally {
    if (fs.existsSync(path.join(__dirname, 'style', 'me.svg'))) fs.unlinkSync(path.join(__dirname, 'style', 'me.svg'));
  }

  // context resolution: style/email.svg wins over style/me.svg.
  fs.writeFileSync(path.join(__dirname, 'style', 'email.svg'),
    WriteLikeMe.generateStyleSVG(Object.assign(WriteLikeMe.createStyleProfile(WriteLikeMe.analyzeText('I write short casual notes. You will like them.')), { context: 'email' })));
  try {
    const got = await rpc('prompts/get', { name: 'write_like_me', arguments: { task: 'say hi', context: 'email' } });
    assert.ok(!got.error, JSON.stringify(got.error));
    assert.match(got.result.messages[0].content.text, /^Context: email\./);
  } finally {
    if (fs.existsSync(path.join(__dirname, 'style', 'email.svg'))) fs.unlinkSync(path.join(__dirname, 'style', 'email.svg'));
  }

  // No style file: message points at generate_style_svg then describe_style.
  const absent = await rpc('prompts/get', { name: 'write_like_me', arguments: { task: 'x', context: 'absent' } });
  assert.ok(!absent.error, JSON.stringify(absent.error));
  assert.ok(absent.result.messages[0].content.text.indexOf('generate_style_svg') >= 0);
  assert.ok(absent.result.messages[0].content.text.indexOf('describe_style') >= 0);

  // check_my_draft message mentions check_draft and embeds the draft.
  const checkGot = await rpc('prompts/get', { name: 'check_my_draft', arguments: { draft: 'This is a draft sentence.' } });
  assert.ok(!checkGot.error, JSON.stringify(checkGot.error));
  assert.ok(checkGot.result.messages[0].content.text.indexOf('check_draft') >= 0);
  assert.ok(checkGot.result.messages[0].content.text.indexOf('This is a draft sentence.') >= 0);

  // prompts/get errors: unknown name and missing required argument -> -32602.
  const unknownPrompt = await rpc('prompts/get', { name: 'nope-prompt', arguments: {} });
  assert.equal(unknownPrompt.error.code, -32602);
  const missingTask = await rpc('prompts/get', { name: 'write_like_me', arguments: {} });
  assert.equal(missingTask.error.code, -32602);
  const missingDraft = await rpc('prompts/get', { name: 'check_my_draft', arguments: { context: 'email' } });
  assert.equal(missingDraft.error.code, -32602);
  // params missing entirely still errors instead of crashing.
  const noParams = await rpc('prompts/get', {});
  assert.equal(noParams.error.code, -32602);

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
