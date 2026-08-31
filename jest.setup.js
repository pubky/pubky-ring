/* global jest */

const { NativeModules } = require('react-native');

const nativeResultError = method => ['true', `Mocked native Pubky.${method} was not configured for this test`];

NativeModules.AppInfo = NativeModules.AppInfo || {
	applicationId: 'to.pubky.ring',
	buildNumber: '1',
	version: '1.0.0',
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
