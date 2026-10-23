import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const base = new URL(process.env.BASE_URL || 'https://seoshiro.github.io/kiln-atelier/');
const expected = process.env.EXPECTED_SHA || execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const response = await fetch(new URL(`release.json?sha=${expected}`,base));
if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
const manifest = await response.json();
if (manifest.sha !== expected) throw new Error(`Live SHA ${manifest.sha} differs from ${expected}`);
const results = await Promise.all(Object.entries(manifest.assets).map(async ([path,hash])=>{
  const res = await fetch(new URL(path,base));
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const actual = createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex');
  if(actual !== hash) throw new Error(`${path}: SHA256 mismatch`);
  return path;
}));
console.log(JSON.stringify({status:'PASS',sha:manifest.sha,verifiedAssets:results.length,base:base.href},null,2));
