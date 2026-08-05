// name=scripts/build-www.js
const fs = require('fs').promises;
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'www');

// Files/dirs to exclude from www
const EXCLUDE = new Set([
  'node_modules',
  '.git',
  'scripts',
  'www',
  'capacitor.config.json',
  'package.json',
  'package-lock.json',
  'package-lock.yaml',
  '.env',
  '.env.example'
]);

async function copyRecursive(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    if (EXCLUDE.has(ent.name)) continue;
    const srcPath = path.join(srcDir, ent.name);
    const destPath = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (ent.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    // remove existing www if present
    await fs.rm(outDir, { recursive: true, force: true });
    await copyRecursive(root, outDir);
    console.log('Built www/ from repo root.');
  } catch (err) {
    console.error('Failed to build www:', err);
    process.exit(1);
  }
}

main();
