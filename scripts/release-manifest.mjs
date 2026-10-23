import { readdir, readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
await mkdir('dist/licenses', {recursive:true});
for (const name of await readdir('licenses')) await copyFile(join('licenses',name),join('dist/licenses',name));
const files = await readdir('dist', { recursive: true, withFileTypes: true });
const assets = {};
for (const entry of files) {
  if (!entry.isFile() || entry.name === 'release.json') continue;
  const path = join(entry.parentPath, entry.name);
  assets[relative('dist', path).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(path)).digest('hex');
}
let sha = process.env.GITHUB_SHA || 'uncommitted-local';
if (!process.env.GITHUB_SHA) { try { sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding:'utf8', stdio:['ignore','pipe','ignore'] }).trim(); } catch { /* First local preview before initialization. */ } }
await writeFile('dist/release.json', JSON.stringify({schema:'kiln.release/v1',sha,assets},null,2)+'\n');
console.log(`Release manifest: ${sha}, ${Object.keys(assets).length} asset hashes`);
