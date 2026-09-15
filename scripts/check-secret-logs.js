#!/usr/bin/env node
/**
 * Deterministic R1 gate: console.* in src/ must not pass secret-bearing identifiers.
 * Static string messages that mention "secret key" in English are allowed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const FORBIDDEN = ['rawInput', 'rawData', 'secretKey', 'mnemonic', 'grant_secret', 'session_secret'];
const CONSOLE_CALL =
	/console\.(log|error|warn|debug|info)\s*\(([\s\S]*?)\)\s*;/g;

const walk = (dir, acc = []) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, acc);
		else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) acc.push(full);
	}
	return acc;
};

const identifierInArgs = (args, name) => {
	const stripped = args.replace(/`(?:\\.|[^`\\])*`/g, '""').replace(/(['"])(?:\\.|[^\\])*?\1/g, '""');
	const re = new RegExp(`(^|[^A-Za-z0-9_$])${name}([^A-Za-z0-9_$]|$)`);
	return re.test(stripped);
};

const files = walk(ROOT);
const hits = [];

for (const file of files) {
	const text = fs.readFileSync(file, 'utf8');
	let match;
	CONSOLE_CALL.lastIndex = 0;
	while ((match = CONSOLE_CALL.exec(text))) {
		const args = match[2];
		const found = FORBIDDEN.filter(name => identifierInArgs(args, name));
		if (found.length) {
			const line = text.slice(0, match.index).split('\n').length;
			hits.push(`${path.relative(path.join(__dirname, '..'), file)}:${line} console.${match[1]} uses ${found.join(', ')}`);
		}
	}
}

if (hits.length) {
	console.error('R1 secret-log gate failed:\n' + hits.map(h => `  ${h}`).join('\n'));
	process.exit(1);
}

console.log(`R1 secret-log gate passed (${files.length} files, no forbidden console identifiers).`);
