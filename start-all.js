const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Front-End & Back-End together...');

const serverPath = path.join(__dirname, 'backend', 'server.js');
const server = spawn('node', [serverPath], { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, 'backend') 
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});
