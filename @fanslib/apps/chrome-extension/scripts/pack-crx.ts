import { execSync } from 'child_process';
import ChromeExtension from 'crx';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');
const keyPath = resolve(rootDir, 'key.pem');
const crxPath = resolve(rootDir, 'fanslib-extension.crx');

const buildExtension = () => {
  console.log('Building extension...');
  execSync('bun run build', { cwd: rootDir, stdio: 'inherit' });
};

const packExtension = async () => {
  if (!existsSync(distDir)) {
    throw new Error(`Dist directory not found: ${distDir}. Run build first.`);
  }

  console.log('Packing extension as CRX...');

  let key: Buffer;
  if (existsSync(keyPath)) {
    console.log('Using existing key file...');
    key = readFileSync(keyPath);
  } else {
    console.log('No key file found. Generating a new key...');
    console.log('Note: Save this key file (key.pem) for future updates.');
    try {
      execSync(`openssl genrsa -out "${keyPath}" 2048`, {
        cwd: rootDir,
        stdio: 'inherit',
      });
      key = readFileSync(keyPath);
      console.log('✅ Key generated successfully.');
    } catch (error) {
      throw new Error(
        'Failed to generate key file. Make sure OpenSSL is installed.\n' +
          'You can also manually generate a key with: openssl genrsa -out key.pem 2048'
      );
    }
  }

  const crxInstance = new ChromeExtension({
    codebase: distDir,
    privateKey: key,
  });

  await crxInstance.load(distDir);
  const crxBuffer = await crxInstance.pack();
  writeFileSync(crxPath, crxBuffer);

  console.log(`✅ Extension packed successfully: ${crxPath}`);
};

const main = async () => {
  try {
    buildExtension();
    await packExtension();
  } catch (error) {
    console.error('Error packing extension:', error);
    process.exit(1);
  }
};

main();
