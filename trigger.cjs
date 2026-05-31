const { spawn } = require('child_process');
const fs = require('fs');

if (fs.existsSync('done.txt')) {
  fs.unlinkSync('done.txt');
}

const child = spawn('npx', ['tsx', 'background_fix.ts'], {
  detached: true,
  stdio: 'ignore'
});

child.unref();
console.log('Background task started');
