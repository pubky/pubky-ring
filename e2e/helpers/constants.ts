export const APP_ID = {
	android: 'to.pubky.ring',
	ios: 'tbd',
};

export function getAppId(): string {
	return driver.isAndroid ? APP_ID.android : APP_ID.ios;
}

export function getAppPath(): string {
	const cap = browser.capabilities as any;
	const possibleKeys = ['app', 'appium:app'];

	for (const key of possibleKeys) {
		if (typeof cap[key] === 'string') return cap[key];
	}

	throw new Error(`App path not defined in capabilities (tried ${possibleKeys.join(', ')})`);
}