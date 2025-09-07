import type { ChainablePromiseElement } from 'webdriverio';
const { expect, fail } = require('chai');

export function elementById(selector: string): ChainablePromiseElement {
	if (driver.isAndroid) {
		return $(`android=new UiSelector().resourceId("${selector}")`);
	} else {
		return $(`~${selector}`);
	}
}

export function elementByText(text: string): ChainablePromiseElement {
	if (driver.isAndroid) {
		return $(`android=new UiSelector().text("${text}")`);
	} else {
		return $(`~${text}`);
	}
}

export async function waitForDisplayed(element: ChainablePromiseElement, timeout?: number, interval: number = 1000): Promise<ChainablePromiseElement> {
	await element.waitForDisplayed({ timeout, interval });
	expect(await element.isDisplayed()).to.be.true;
	return element;
}

export async function completeOnboardingFlow(): Promise<void> {
	await waitForAppReady();

	await takeScreenshot('before-pause-start-onboarding-flow');
	console.log('Waiting 5s for app to be ready...');
	await driver.pause(5_000);
	await takeScreenshot('after-pause-start-onboarding-flow');
	// Wait for terms screen to be displayed - use text content instead of testID
	const termsScreen = await elementByText('Terms of Use.');
	await waitForDisplayed(termsScreen, 60_000);
	await expect(await termsScreen.getText()).to.equal('Terms of Use.');

	// Tap terms checkbox
	await driver.pause(1_000);
	await takeScreenshot('before-terms-checkbox');
	(await waitForDisplayed(elementById('TermsAgreeCheckbox'))).click();

	// Tap privacy checkbox
	await driver.pause(1_000);
	await takeScreenshot('before-privacy-checkbox');
	(await waitForDisplayed(elementById('PrivacyAgreeCheckbox'))).click();

	// Tap continue button - use text content instead of testID
	await driver.pause(1_000);
	await takeScreenshot('before-terms-continue-button');
	const continueButton = elementById('TermsContinueButtonText');
	(await waitForDisplayed(continueButton)).click();

	// Wait for onboarding screen to be displayed and tap get started button
	await driver.pause(1_000);
	await takeScreenshot('before-get-started-button');
	const getStartedButton = elementById('OnboardingGetStartedButtonText');
	(await waitForDisplayed(getStartedButton)).click();

	// Wait for home page's add pubky button to be displayed
	await driver.pause(1_000);
	await takeScreenshot('before-empty-state-add-pubky-button');
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

export async function takeScreenshot(name: string): Promise<void> {
	try {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const filename = `screenshot-${name}-${timestamp}.png`;
		await driver.saveScreenshot(`./e2e/screenshots/${filename}`);
		console.log(`Screenshot saved: ${filename}`);
	} catch (error) {
		console.error('Failed to take screenshot:', error);
	}
}

export async function waitForAppReady(): Promise<void> {
	console.log('Waiting for app to be ready...');
	
	// Wait for the app to be in foreground and responsive
	for (let i = 0; i < 30; i++) {
		try {
			// Check if app is in foreground
			const currentActivity = await driver.getCurrentActivity();
			console.log(`Current activity: ${currentActivity}`);
			
			// Check if app is responsive by getting app state
			const appState = await driver.queryAppState('to.pubky.ring');
			console.log(`App state: ${appState}`);
			
			// App state 4 means "running in foreground"
			if (appState === 4) {
				console.log('App is ready - running in foreground');
				return;
			}
			
			// Also check if we can get the current package (indicates app is loaded)
			const currentPackage = await driver.getCurrentPackage();
			if (currentPackage === 'to.pubkyring') {
				console.log('App is ready - package loaded');
				return;
			}
			
		} catch (error) {
			console.log(`Attempt ${i + 1}: App not ready yet (${error.message}), waiting...`);
		}
		
		await driver.pause(2000);
	}
	
	throw new Error('App did not become ready within 60 seconds');
}