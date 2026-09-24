/* global jest */

const { NativeModules } = require('react-native');

const nativeResultError = method => ['true', `Mocked native Pubky.${method} was not configured for this test`];

NativeModules.AppInfo = NativeModules.AppInfo || {
	applicationId: 'app.pubkyring',
	buildNumber: '1',
	version: '1.0.0',
};

NativeModules.SharedPubky = NativeModules.SharedPubky || {
	listExternal: jest.fn(async () => []),
	getExternalSecret: jest.fn(async () => ''),
	setOwned: jest.fn(async () => undefined),
	removeOwned: jest.fn(async () => undefined),
	removeAllOwned: jest.fn(async () => undefined),
};

NativeModules.Pubky = NativeModules.Pubky || new Proxy(
	{
		addListener: jest.fn(),
		removeListeners: jest.fn(),
	},
	{
		get(target, prop) {
			if (prop in target) return target[prop];
			if (typeof prop !== 'string') return undefined;
			target[prop] = jest.fn(async () => nativeResultError(prop));
			return target[prop];
		},
	},
);
