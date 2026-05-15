const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('📦 Installing missing packages...');

try {
    execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'backend') });
    console.log('✅ Packages installed successfully.\n');
} catch (error) {
    console.error('❌ Error installing packages:', error.message);
    process.exit(1);
}

console.log('🚀 Starting Front-End & Back-End together...');

const serverPath = path.join(__dirname, 'backend', 'server.js');
const server = spawn('node', [serverPath], { 
    stdio: 'inherit', 
    cwd: path.join(__dirname, 'backend') 
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});
