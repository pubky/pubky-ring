const { expect } = require('chai');
const { elementById, waitForDisplayed } = require('../helpers/actions');

/**
 * Basic onboarding flow:
 * 1) Accept both checkboxes on Terms screen, tap Continue.
 * 2) On Onboarding screen, check Get Started button is displayed.
 */

// Note: This test will be redone when we have the new onboarding flow and more tests will be added.
// We will also use PageObjectModel pattern for the tests, not using selectors and Appium api directly.

describe('Onboarding flow', () => {

	it('should accept terms and navigate to Home', async () => {
		const termsScreen = await elementById('TermsOfUseTitle');
		await waitForDisplayed(termsScreen, 60_000);
		expect(await termsScreen.isDisplayed()).to.be.true;
		expect(await termsScreen.getText()).to.equal('Terms of Use.');

		const termsRow = await elementById('TermsAgreeRow');
		await termsRow.click();

		const privacyRow = await elementById('PrivacyAgreeRow');
		await privacyRow.click();

		const continueBtn = await elementById('TermsContinueButton');
		await continueBtn.click();

		const onboardingGetStartedButton = await elementById('OnboardingGetStartedButton');
		await onboardingGetStartedButton.click();

		const addPubkyButton = await elementById('EmptyStateAddPubkyButton');
		await waitForDisplayed(addPubkyButton);
		expect(await addPubkyButton.isDisplayed()).to.be.true;
	});
});
