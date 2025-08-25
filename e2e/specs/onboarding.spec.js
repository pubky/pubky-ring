const { expect } = require('chai');

/**
 * Basic onboarding flow:
 * 1) Accept both checkboxes on Terms screen, tap Continue.
 * 2) On Onboarding screen, check Get Started button is displayed.
 */

// Note: This test will be redone when we have the new onboarding flow and more tests will be added.
// We will also use PageObjectModel pattern for the tests, not using selectors and Appium api directly.

describe('Onboarding flow', () => {

	it('should accept terms and navigate to Home', async () => {
		// Terms screen
		const termsScreen = await $('~TermsContinueButton');
		await termsScreen.waitForDisplayed({ interval: 5000, timeout: 60_000 });

		const termsRow = await $('~TermsAgreeRow');
		await termsRow.click();

		const privacyRow = await $('~PrivacyAgreeRow');
		await privacyRow.click();

		const continueBtn = await $('~TermsContinueButton');
		await continueBtn.click();

		const onboardingGetStartedButton = await $('~OnboardingGetStartedButton');
		expect(await onboardingGetStartedButton.isDisplayed()).to.equal(true);
	});
});
