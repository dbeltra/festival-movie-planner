#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read current version
const versionPath = path.join(__dirname, 'version.json');
const swPath = path.join(__dirname, 'sw.js');

if (!fs.existsSync(versionPath)) {
  console.error('version.json not found');
  process.exit(1);
}

const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
const currentVersion = versionData.version;

// Parse version and increment patch number
const versionParts = currentVersion.split('.');
const major = parseInt(versionParts[0]);
const minor = parseInt(versionParts[1]);
const patch = parseInt(versionParts[2]) + 1;

const newVersion = `${major}.${minor}.${patch}`;

// Update version.json
versionData.version = newVersion;
versionData.buildDate = new Date().toISOString().split('T')[0];
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

// Update service worker
let swContent = fs.readFileSync(swPath, 'utf8');
swContent = swContent.replace(
  /const CACHE_VERSION = '[^']+';/,
  `const CACHE_VERSION = '${newVersion}';`
);
fs.writeFileSync(swPath, swContent);

console.log(`✅ Version updated from ${currentVersion} to ${newVersion}`);
console.log(`📅 Build date: ${versionData.buildDate}`);
console.log(`🔄 Service worker cache updated`);
console.log(
  `\n🚀 Changes will take effect after users refresh and update their service worker`
);
