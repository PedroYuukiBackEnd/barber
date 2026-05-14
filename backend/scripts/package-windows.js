const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const backendDir = path.join(__dirname, '..');
const projectDir = path.join(backendDir, '..');
const distDir = path.join(backendDir, 'dist');
const frontendSource = path.join(projectDir, 'frontend');
const frontendTarget = path.join(distDir, 'frontend');

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

fs.mkdirSync(distDir, { recursive: true });
if (process.platform === 'win32') {
  execFileSync(
    'cmd.exe',
    ['/c', path.join(backendDir, 'node_modules', '.bin', 'pkg.cmd'), 'server.js', '--out-path', 'dist', '--targets', 'node18-win-x64'],
    { cwd: backendDir, stdio: 'inherit' }
  );
} else {
  execFileSync(
    path.join(backendDir, 'node_modules', '.bin', 'pkg'),
    ['server.js', '--out-path', 'dist', '--targets', 'node18-win-x64'],
    { cwd: backendDir, stdio: 'inherit' }
  );
}

if (fs.existsSync(frontendTarget)) {
  fs.rmSync(frontendTarget, { recursive: true, force: true });
}
copyDirectory(frontendSource, frontendTarget);

const envExample = path.join(backendDir, '.env.example');
const distEnv = path.join(distDir, '.env');
if (!fs.existsSync(distEnv) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, distEnv);
}

console.log('Pacote Windows pronto em backend/dist.');
