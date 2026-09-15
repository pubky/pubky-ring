#!/usr/bin/env node
/**
 * Deterministic H7 gate: keychain persist/wipe must be awaited, not .then().
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const CALLS = ['wipeKeychain', 'deletePubky', 'setKeychainValue'];
const WINDOW_LINES = 12;

const walk = (dir, acc = []) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, acc);
		else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) acc.push(full);
	}
	return acc;
};

const files = walk(ROOT);
const hits = [];

for (const file of files) {
	const lines = fs.readFileSync(file, 'utf8').split('\n');
	const rel = path.relative(path.join(__dirname, '..'), file);
	for (let i = 0; i < lines.length; i++) {
		for (const name of CALLS) {
			if (!new RegExp(`${name}\\s*\\(`).test(lines[i])) continue;
			if (new RegExp(`(import|export).*${name}`).test(lines[i])) continue;
			const window = lines.slice(i, i + WINDOW_LINES).join('\n');
			if (/\.then\s*\(/.test(window)) {
				hits.push(`${rel}:${i + 1} ${name}(...).then`);
			}
		}
	}
}

if (hits.length) {
	console.error('H7 awaited-keychain gate failed:\n' + hits.map(h => `  ${h}`).join('\n'));
	process.exit(1);
}

console.log(`H7 awaited-keychain gate passed (${files.length} files).`);
