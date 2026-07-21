const reactNativeConfig = require('@react-native/eslint-config/flat');
const reactHooks = require('eslint-plugin-react-hooks');

const reactCompilerRules = Object.fromEntries(
	Object.keys(reactHooks.configs.flat['recommended-latest'].rules)
		.filter(ruleName => !['react-hooks/rules-of-hooks', 'react-hooks/exhaustive-deps'].includes(ruleName))
		.map(ruleName => [ruleName, 'warn']),
);

module.exports = [
	...reactNativeConfig,
	reactHooks.configs.flat['recommended-latest'],
	{
		languageOptions: {
			globals: {
				localStorage: 'readonly',
			},
		},
		rules: {
			...reactCompilerRules,
			'ft-flow/define-flow-type': 0,
			'ft-flow/use-flow-type': 0,
			'react-hooks/exhaustive-deps': [
				'error',
				{
					additionalHooks: 'useDebouncedEffect',
				},
			],
		},
	},
	{
		files: ['.maestro/**/*.js'],
		languageOptions: {
			globals: {
				HOMESERVER_ADMIN_PASSWORD: 'readonly',
				HOMESERVER_INVITE_URL: 'readonly',
				INVITE_CODE: 'readonly',
				http: 'readonly',
				output: 'writable',
			},
		},
	},
];
