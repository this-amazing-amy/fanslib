import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APPS_DIR = resolve(__dirname, '..');
const CHROME_EXTENSION_DIR = join(APPS_DIR, 'chrome-extension');
const ELECTRON_COMPANION_DIR = join(APPS_DIR, 'electron-companion');

const SYNC_TARGET = process.env.FANSLIB_SYNC_TARGET;

if (!SYNC_TARGET) {
  console.error('❌ FANSLIB_SYNC_TARGET environment variable is not set.');
  console.error('   Set it to your Google Drive sync folder path, e.g.:');
  console.error(
    '   export FANSLIB_SYNC_TARGET="$HOME/Google Drive/My Drive/fanslib-releases"'
  );
  process.exit(1);
}

const log = (message: string) => console.log(`\n→ ${message}`);
const success = (message: string) => console.log(`✅ ${message}`);
const error = (message: string) => console.error(`❌ ${message}`);

const ensureDir = (path: string) => {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
};

const cleanDir = (path: string) => {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
  }
  mkdirSync(path, { recursive: true });
};

const buildChromeExtension = () => {
  log('Building Chrome extension...');
  execSync('bun run build', {
    cwd: CHROME_EXTENSION_DIR,
    stdio: 'inherit',
  });
  success('Chrome extension built');
};

const buildElectronCompanion = () => {
  log('Building Electron companion for Windows...');
  execSync('bun run build && bun run dist:win', {
    cwd: ELECTRON_COMPANION_DIR,
    stdio: 'inherit',
  });
  success('Electron companion built for Windows');
};

const findWindowsInstaller = (): string | undefined => {
  const distDir = join(ELECTRON_COMPANION_DIR, 'dist');
  if (!existsSync(distDir)) return undefined;

  const files = readdirSync(distDir);
  return files.find((file) => file.endsWith('.exe') && file.includes('setup'));
};

const syncToTarget = () => {
  log(`Syncing to ${SYNC_TARGET}...`);
  ensureDir(SYNC_TARGET);

  const chromeExtensionDist = join(CHROME_EXTENSION_DIR, 'dist');
  const chromeExtensionTarget = join(SYNC_TARGET, 'chrome-extension');

  if (!existsSync(chromeExtensionDist)) {
    error('Chrome extension dist folder not found. Build may have failed.');
    process.exit(1);
  }

  cleanDir(chromeExtensionTarget);
  cpSync(chromeExtensionDist, chromeExtensionTarget, { recursive: true });
  success(`Chrome extension dist copied to ${chromeExtensionTarget}`);

  const installerName = findWindowsInstaller();
  if (!installerName) {
    error(
      'Windows installer not found in electron-companion/dist. Build may have failed.'
    );
    process.exit(1);
  }

  const installerSource = join(ELECTRON_COMPANION_DIR, 'dist', installerName);
  const installerTarget = join(SYNC_TARGET, installerName);

  cpSync(installerSource, installerTarget);
  success(`Windows installer copied to ${installerTarget}`);
};

const main = () => {
  console.log('🚀 FansLib Sync to Drive');
  console.log('========================\n');
  console.log(`Target: ${SYNC_TARGET}`);

  const skipBuild = process.argv.includes('--skip-build');

  if (skipBuild) {
    log('Skipping builds (--skip-build flag)');
  } else {
    buildChromeExtension();
    buildElectronCompanion();
  }

  syncToTarget();

  console.log('\n========================');
  success('All done! Files synced to Google Drive.');
};

main();
