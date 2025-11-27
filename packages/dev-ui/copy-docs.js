/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsSource = path.resolve(__dirname, '../core/docs');
const docsTarget = path.resolve(__dirname, 'public/docs');
const publicDir = path.resolve(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Remove existing docs if they exist
if (fs.existsSync(docsTarget)) {
  fs.rmSync(docsTarget, { recursive: true, force: true });
}

// Copy docs to public directory
if (fs.existsSync(docsSource)) {
  // Use cp command for cross-platform compatibility
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    execSync(`xcopy /E /I /Y "${docsSource}" "${docsTarget}"`, { stdio: 'inherit' });
  } else {
    execSync(`cp -r "${docsSource}" "${docsTarget}"`, { stdio: 'inherit' });
  }
  console.log('✓ Docs copied to public/docs');
} else {
  console.warn('⚠ Docs directory not found. Run: cd ../core && npm run docs');
}
