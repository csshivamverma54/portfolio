import { spawn } from 'child_process';

console.log('Starting Portfolio API Server & Vite Development Server...');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';
const nodeCmd = isWindows ? 'node.exe' : 'node';

const serverProcess = spawn(nodeCmd, ['server/index.js'], {
  stdio: 'inherit',
  shell: true
});

const viteProcess = spawn(npxCmd, ['vite', '--host', '--port', '5173'], {
  stdio: 'inherit',
  shell: true
});

function handleExit() {
  serverProcess.kill();
  viteProcess.kill();
  process.exit();
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', handleExit);
