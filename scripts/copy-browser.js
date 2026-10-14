const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'index.js');
const destination = path.join(projectRoot, 'docs', 'public', 'writelikeme.js');

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
