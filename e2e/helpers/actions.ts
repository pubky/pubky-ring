import type { ChainablePromiseElement } from 'webdriverio';
const { expect, fail } = require('chai');

export function elementById(selector: string): ChainablePromiseElement {
	if (driver.isAndroid) {
		return $(`android=new UiSelector().resourceId("${selector}")`);
	} else {
		return $(`~${selector}`);
	}
}

export async function waitForDisplayed(element: ChainablePromiseElement, timeout?: number, interval: number = 1000): Promise<ChainablePromiseElement> {
	await element.waitForDisplayed({ timeout, interval });
	expect(await element.isDisplayed()).to.be.true;
	return element;
}

export async function completeOnboardingFlow(): Promise<void> {
	// Wait for terms screen to be displayed
	const termsScreen = await elementById('TermsOfUseTitle');
	await waitForDisplayed(termsScreen, 60_000);
	expect(await termsScreen.getText()).to.equal('Terms of Use.');

	// Tap terms checkbox
	(await waitForDisplayed(elementById('TermsAgreeRow'))).click();

	// Tap privacy checkbox
	(await waitForDisplayed(elementById('PrivacyAgreeRow'))).click();

	// Tap continue button
	(await waitForDisplayed(elementById('TermsContinueButton'))).click();

	// Wait for onboarding screen to be displayed and tap get started button
	(await waitForDisplayed(elementById('OnboardingGetStartedButton'))).click();

	// Wait for home page's add pubky button to be displayed
	await waitForDisplayed(elementById('EmptyStateAddPubkyButton'));
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

export async function sendReturnKey(): Promise<void> {
	if (driver.isAndroid) {
		await driver.pressKeyCode(66); // Android enter key
	} else if (driver.isIOS) {
		await driver.sendKeys(['\n']);
	} else {
		throw new Error('sendReturnKey: unsupported platform');
	}
}

// Note: cannot use driver.hideKeyboard() when bottom sheet is open because it also dismisses it
export async function dismissKeyboard(element?: ChainablePromiseElement): Promise<void> {
	// Assert that keyboard is shown
	await waitForKeyboardToBeShown();

	if (driver.isAndroid) {
		// use back button to dismiss keyboard on Android
		driver.pressKeyCode(4);
	} else if (driver.isIOS) {
		// either use return key or click on non-interactive element (e.g. title text) to dismiss keyboard on iOS
		// because forms with multiple input fields behave differently when using return key
		if (!element) {
			await sendReturnKey();
		} else {
			await element.click();
		}
	} else {
		throw new Error('dismissKeyboard: unsupported platform');
	}
}