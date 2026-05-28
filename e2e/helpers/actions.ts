import type { ChainablePromiseElement } from 'webdriverio';
const { expect, fail } = require('chai');

export function elementById(selector: string): ChainablePromiseElement {
	if (driver.isAndroid) {
		return $(`android=new UiSelector().resourceId("${selector}")`);
	} else {
		return $(`~${selector}`);
	}
}

export async function waitForDisplayed(
	element: ChainablePromiseElement,
	timeout?: number,
	interval: number = 1000,
): Promise<ChainablePromiseElement> {
	await element.waitForDisplayed({ timeout, interval });
	expect(await element.isDisplayed()).to.be.true;
	return element;
}

export async function completeOnboardingFlow(): Promise<void> {
	// Wait for terms screen to be displayed
	const termsScreen = await elementById('TermsOfUseTitle');
	await waitForDisplayed(termsScreen, 60_000);
	expect(await termsScreen.getText()).to.equal('Terms of Use.');

	// Tap continue button
	(await waitForDisplayed(elementById('TermsContinueButton'))).click();

	// Wait for onboarding screen to be displayed and tap get started button
	(await waitForDisplayed(elementById('OnboardingGetStartedButton'))).click();

	// Wait for home page's add pubky button to be displayed
	await waitForDisplayed(elementById('AddPubkyButton'));
}

export async function waitForKeyboardToBeShown(): Promise<boolean> {
	let retries = 0;
	const maxRetries = 20;
	const interval = 250;
	while (retries < maxRetries) {
		if (await driver.isKeyboardShown()) {
			expect(await driver.isKeyboardShown()).to.be.true;
			return true;
		}
		await driver.pause(interval);
		retries++;
	}
	fail('Keyboard was not shown after waiting');
	return false;
}

export async function enterText(
	element: ChainablePromiseElement,
	value: string,
	expectedValue: string = value,
): Promise<void> {
	const input = await waitForDisplayed(element);

	await input.click();
	await waitForKeyboardToBeShown();
	await input.clearValue();
	await driver.pause(100);

	if (driver.isIOS) {
		for (const character of value) {
			await pressKeys(character);
			await driver.pause(100);
		}

		expect(await input.getText()).to.equal(expectedValue);
		return;
	}

	await input.setValue(value);
	await driver.pause(250);

	const actualValue = await input.getText();
	if (actualValue === expectedValue) {
		return;
	}

	await input.clearValue();
	await driver.pause(100);
	for (const character of value) {
		await pressKeys(character);
		await driver.pause(75);
	}

	expect(await input.getText()).to.equal(expectedValue);
}

export async function sendReturnKey(): Promise<void> {
	if (driver.isAndroid) {
		await driver.pressKeyCode(66); // Android enter key
	} else if (driver.isIOS) {
		await pressKeys('\uE007');
	} else {
		throw new Error('sendReturnKey: unsupported platform');
	}
}

async function pressKeys(value: string): Promise<void> {
	await driver.performActions([
		{
			type: 'key',
			id: 'keyboard',
			actions: [
				{ type: 'keyDown', value },
				{ type: 'keyUp', value },
			],
		},
	]);
	await driver.releaseActions();
}

export async function hideKeyboardIfShown(): Promise<void> {
	if (!(await driver.isKeyboardShown())) {
		return;
	}

	await hideKeyboardWithoutSubmitting();
}

// Note: cannot use driver.hideKeyboard() when bottom sheet is open because it also dismisses it
export async function dismissKeyboard(element?: ChainablePromiseElement): Promise<void> {
	if (!(await driver.isKeyboardShown())) {
		return;
	}

	if (driver.isAndroid) {
		// use back button to dismiss keyboard on Android
		driver.pressKeyCode(4);
	} else if (driver.isIOS) {
		await hideKeyboardWithoutSubmitting(element);
	} else {
		throw new Error('dismissKeyboard: unsupported platform');
	}
}

async function hideKeyboardWithoutSubmitting(element?: ChainablePromiseElement): Promise<void> {
	if (driver.isIOS) {
		if (element) {
			await element.click();
			if (await waitForKeyboardToBeHidden(2_000)) {
				return;
			}
		}

		const { width, height } = await driver.getWindowRect();
		await tapAt(Math.round(width / 2), Math.round(height * 0.18));
		if (await waitForKeyboardToBeHidden(2_000)) {
			return;
		}

		await tryHideKeyboardWithHidEscape();
		if (await waitForKeyboardToBeHidden(1_000)) {
			return;
		}

		await tryHideKeyboardWithEscapeKey();
		if (await waitForKeyboardToBeHidden(1_000)) {
			return;
		}

		throw new Error('Keyboard is still shown after dismissal attempts');
	}

	await driver.hideKeyboard();
	await driver.pause(500);
}

async function waitForKeyboardToBeHidden(timeout: number): Promise<boolean> {
	try {
		await driver.waitUntil(async () => !(await driver.isKeyboardShown()), {
			timeout,
			interval: 200,
			timeoutMsg: 'Keyboard is still shown',
		});
		return true;
	} catch {
		return false;
	}
}

async function tryHideKeyboardWithHidEscape(): Promise<void> {
	try {
		await driver.execute('mobile: performIoHidEvent', {
			page: 0x07,
			usage: 0x29,
			durationSeconds: 0.005,
		});
		await driver.pause(500);
	} catch {
		// Some environments reject low-level HID events.
	}
}

async function tryHideKeyboardWithEscapeKey(): Promise<void> {
	try {
		await driver.execute('mobile: keys', { keys: ['XCUIKeyboardKeyEscape'] });
		await driver.pause(500);
	} catch {
		// Not all Appium/XCUITest versions expose mobile: keys.
	}
}

async function tapAt(x: number, y: number): Promise<void> {
	await driver.performActions([
		{
			type: 'pointer',
			id: 'finger',
			parameters: { pointerType: 'touch' },
			actions: [
				{ type: 'pointerMove', duration: 0, x, y },
				{ type: 'pointerDown', button: 0 },
				{ type: 'pause', duration: 100 },
				{ type: 'pointerUp', button: 0 },
			],
		},
	]);
	await driver.releaseActions();
}
