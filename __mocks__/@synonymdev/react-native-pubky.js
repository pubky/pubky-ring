const { err } = require('@synonymdev/result');

module.exports = {
	__esModule: true,
	parseDeepLink: jest.fn(async () => err('not a deeplink')),
	mnemonicPhraseToKeypair: jest.fn(async () => err('not a mnemonic')),
	getPublicKeyFromSecretKey: jest.fn(async () => err('not a secret key')),
	generateMnemonicPhraseAndKeypair: jest.fn(async () =>
		err('Mocked react-native-pubky.generateMnemonicPhraseAndKeypair was not configured for this test'),
	),
	signOut: jest.fn(async () => err('Mocked react-native-pubky.signOut was not configured for this test')),
};
