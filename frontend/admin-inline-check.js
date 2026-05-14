const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
const match = html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i);
if (!match) {
  console.error('No <script> block found');
  process.exit(1);
}
const script = match[1];
new vm.Script(script, { filename: 'admin.html inline script' });
console.log('Admin inline script syntax OK');
