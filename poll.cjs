const fs = require('fs');

function check() {
  if (fs.existsSync('done.txt')) {
    const text = fs.readFileSync('done.txt', 'utf8');
    console.log('Background task finished with status: ' + text);
    process.exit(0);
  } else {
    setTimeout(check, 3000);
  }
}

console.log('Waiting for background task...');
check();
