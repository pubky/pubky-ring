import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const iconsDir = path.join(rootDir, 'src/icons');
const svgDir = path.join(iconsDir, 'svg');
const generatedDir = path.join(iconsDir, 'generated');
const indexPath = path.join(iconsDir, 'index.ts');
const binDir = path.join(rootDir, 'node_modules/.bin');
const binExtension = process.platform === 'win32' ? '.cmd' : '';

const run = (command, args) => {
	execFileSync(path.join(binDir, `${command}${binExtension}`), args, {
		cwd: rootDir,
		stdio: 'inherit',
	});
};

run('svgr', ['--out-dir', generatedDir, svgDir]);

const iconNames = fs
	.readdirSync(generatedDir)
	.filter(fileName => fileName.endsWith('.tsx'))
	.map(fileName => path.basename(fileName, '.tsx'))
	.sort((a, b) => a.localeCompare(b));

const imports = iconNames.map(iconName => `import ${iconName}Svg from './generated/${iconName}';`);
const exports = iconNames.map(iconName => `export const ${iconName} = createIcon(${iconName}Svg);`);

const content = `${imports.join('\n')}
import { createIcon } from './createIcon';

export { createIcon } from './createIcon';
${exports.join('\n')}
export type { IconProps } from './types';
`;

fs.writeFileSync(indexPath, content);

run('prettier', ['--write', indexPath]);
