module.exports = {
	root: true,
	extends: '@react-native',
	globals: {
		localStorage: false,
	},
	overrides: [
		{
			files: ['*.ts', '*.tsx'],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: ['./tsconfig.json'],
			},
			plugins: ['@typescript-eslint'],
			rules: {
				'@typescript-eslint/explicit-function-return-type': 2,
				'@typescript-eslint/semi': 2,
				'@typescript-eslint/no-misused-promises': [
					2,
					{
						checksVoidReturn: {
							arguments: false,
							attributes: false,
							properties: false,
						},
					},
				],
				'@typescript-eslint/no-shadow': 2,
				'@typescript-eslint/no-unused-vars': 2,
				'@typescript-eslint/prefer-optional-chain': 2,
			},
		},
		{
			files: ['*.js', '*.jsx'],
			rules: {
				'@typescript-eslint/no-misused-promises': 0,
			},
		},
	],
	rules: {
		'brace-style': [2, '1tbs', { allowSingleLine: true }],
		indent: [
			2,
			'tab',
			{ SwitchCase: 1, ignoredNodes: ['ConditionalExpression'] },
		],
		'no-async-promise-executor': 0,
		'no-buffer-constructor': 0,
		'no-case-declarations': 0,
		'no-console': 0,
		'no-empty': [2, { allowEmptyCatch: true }],
		'no-promise-executor-return': 2,
		'no-shadow': 0,
		'no-undef': 0,
		'no-useless-escape': 0,
		'object-curly-spacing': [
			2,
			'always',
			{
				objectsInObjects: true,
			},
		],
		'require-atomic-updates': 0,
		semi: 2,

		// React Plugin
		'react/default-props-match-prop-types': 2,
		'react/jsx-equals-spacing': [2, 'never'],
		'react/jsx-curly-spacing': [
			2,
			{
				when: 'never',
				attributes: { allowMultiline: true },
				children: true,
			},
		],
		'react/jsx-uses-vars': 2,
		'react/jsx-wrap-multilines': 2,
		'react/jsx-tag-spacing': [
			2,
			{
				closingSlash: 'never',
				beforeSelfClosing: 'always',
				afterOpening: 'never',
				beforeClosing: 'never',
			},
		],
		'react/jsx-indent': [2, 'tab', { indentLogicalExpressions: false }],
		'react/jsx-child-element-spacing': 2,
		'react/no-unsafe': [2, { checkAliases: true }],
		'react/no-unused-prop-types': 2,
		'react/prop-types': 2,

		// React-Native Plugin
		'react-native/no-single-element-style-arrays': 2,
		'react-native/no-unused-styles': 2,
		'react-native/no-raw-text': 0,

		// Jest Plugin
		'jest/no-disabled-tests': 0,
		'react-hooks/exhaustive-deps': [
			'error',
			{
				additionalHooks: 'useDebouncedEffect',
			},
		],

		// prettier
		'no-mixed-spaces-and-tabs': 0,
	},
};
