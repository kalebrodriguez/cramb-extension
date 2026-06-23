#!/usr/bin/env node
// Cramb release helper: bump version + roll the CHANGELOG + produce store zips.
//
//   pnpm release <version>          e.g. pnpm release 1.0.0
//   pnpm release <version> --dry    preview the file edits, build nothing
//
// It does NOT commit, tag, or push — it prints those commands for you to run,
// so a release stays reversible until you choose to publish.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = 'https://github.com/kalebrodriguez/cramb-extension';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const version = args.find((a) => !a.startsWith('--'));

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!version) fail('Usage: pnpm release <version> [--dry]   (e.g. pnpm release 1.0.0)');
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version)) fail(`Not a valid semver: "${version}"`);

const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const prev = pkg.version;
if (prev === version) fail(`package.json is already at ${version}`);
console.log(`Cramb release: ${prev} → ${version}${dry ? '  (dry run)' : ''}\n`);

// 1) package.json version
pkg.version = version;
const pkgOut = JSON.stringify(pkg, null, 2) + '\n';

// 2) CHANGELOG: convert [Unreleased] to the version, open a fresh [Unreleased].
const clPath = path.join(root, 'CHANGELOG.md');
let cl = readFileSync(clPath, 'utf8');
const today = new Date().toISOString().slice(0, 10);
if (!cl.includes('## [Unreleased]')) fail('CHANGELOG.md has no "## [Unreleased]" heading');

cl = cl.replace('## [Unreleased]', `## [Unreleased]\n\n## [${version}] - ${today}`);

const unreleasedLink = `[Unreleased]: ${REPO}/compare/v${version}...HEAD`;
const versionLink = `[${version}]: ${REPO}/releases/tag/v${version}`;
if (/^\[Unreleased\]:.*$/m.test(cl)) {
  cl = cl.replace(/^\[Unreleased\]:.*$/m, `${unreleasedLink}\n${versionLink}`);
} else {
  cl = `${cl.trimEnd()}\n\n${unreleasedLink}\n${versionLink}\n`;
}

if (dry) {
  console.log('--- package.json ---');
  console.log(`  "version": "${version}"`);
  console.log('\n--- CHANGELOG.md (top) ---');
  console.log(cl.split('\n').slice(0, 14).join('\n'));
  console.log('\n(dry run — nothing written, no build)');
  process.exit(0);
}

writeFileSync(pkgPath, pkgOut);
writeFileSync(clPath, cl);
console.log('✓ Bumped package.json + rolled CHANGELOG.md');

// 3) Build + zip both targets (wxt zip builds internally).
console.log('\nZipping Chrome…');
execSync('pnpm zip', { cwd: root, stdio: 'inherit' });
console.log('\nZipping Firefox…');
execSync('pnpm zip:firefox', { cwd: root, stdio: 'inherit' });

console.log(`
✓ Release ${version} prepared. Artifacts in .output/:
    cramb-${version}-chrome.zip     → Chrome Web Store
    cramb-${version}-firefox.zip    → Firefox AMO
    cramb-${version}-sources.zip    → AMO source upload

Next (review the diff first, then):
    git add package.json CHANGELOG.md
    git commit -m "release: v${version}"
    git tag v${version}
    git push && git push --tags
    gh release create v${version} .output/cramb-${version}-*.zip --notes-file <(sed -n '/## \\[${version}\\]/,/## \\[/p' CHANGELOG.md)
`);
