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

const FRONTEND_ENV_KEYS = [
  'STRIPE_PUBLIC_KEY',
  'STRIPE_BOOKING_PRICE_ID',
  'SUPABASE_BOOKING_FEE_ENDPOINT',
  'SUPABASE_REFUND_ENDPOINT',
  'SUPABASE_PAYMENT_AUDIT_ENDPOINT',
  'SUPABASE_STRIPE_WEBHOOK_ENDPOINT'
];

function parseDotEnv(content) {
  const env = {};
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function buildFrontendEnv() {
  let fileEnv = {};
  const envPath = path.join(root, '.env');
  try {
    const envRaw = await fs.readFile(envPath, 'utf8');
    fileEnv = parseDotEnv(envRaw);
  } catch (_) {
    // .env is optional
  }

  const resolvedEnv = {};
  for (const key of FRONTEND_ENV_KEYS) {
    const value = process.env[key] ?? fileEnv[key];
    if (value) resolvedEnv[key] = value;
  }
  return resolvedEnv;
}

async function writeEnvBundle() {
  const env = await buildFrontendEnv();
  const envJs = `window.__INSPECTPRO_ENV = ${JSON.stringify(env, null, 2)};\n`;
  await fs.writeFile(path.join(outDir, 'env.js'), envJs, 'utf8');
}

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
    await writeEnvBundle();
    console.log('Built www/ from repo root.');
  } catch (err) {
    console.error('Failed to build www:', err);
    process.exit(1);
  }
}

main();
