const inlineBuildFlags = ({ types: t }) => ({
	name: 'inline-build-flags',
	visitor: {
		Identifier(path) {
			if (path.node.name !== '__E2E_DISABLE_ANIMATIONS__' || !path.isReferencedIdentifier()) {
				return;
			}

			path.replaceWith(t.booleanLiteral(process.env.E2E_DISABLE_ANIMATIONS === 'true'));
		},
	},
});

module.exports = {
	presets: ['module:@react-native/babel-preset'],
	plugins: [
		inlineBuildFlags,
		'react-native-worklets/plugin',
	],
};
