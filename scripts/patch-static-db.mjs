import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(root, '../public/static-db.json');
if (!fs.existsSync(dbPath)) {
  console.log('[static-db] No public/static-db.json found; skipping legacy CDN migration.');
  process.exit(0);
}

const original = fs.readFileSync(dbPath, 'utf8');
const legacyPattern = /https?:\/\/(?:www\.)?fsldownload\.com/gi;
const count = (original.match(legacyPattern) || []).length;
const migrated = original.replace(legacyPattern, 'https://fsl.movielink.tv');
if (migrated !== original) fs.writeFileSync(dbPath, migrated, 'utf8');
console.log('[static-db] Migrated ' + count + ' legacy fsldownload.com URLs to fsl.movielink.tv.');
