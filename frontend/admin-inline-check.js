const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
const match = html.match(/<script[^>]*>([\s\S]*)<\/script>/i);
if (!match) {
  console.error('No <script> block found');
  process.exit(1);
}
const script = match[1];
fs.writeFileSync(path.join(__dirname, 'admin-inline-check-extracted.js'), script, 'utf8');
console.log('Extracted script to admin-inline-check-extracted.js');
