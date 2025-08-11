const { expect } = require('chai');

/**
 * Basic onboarding flow:
 * 1) Accept both checkboxes on Terms screen, tap Continue.
 * 2) On Onboarding screen, tap Get Started.
 * 3) Expect Home screen to be visible.
 */

describe('Onboarding flow', () => {
  it('should accept terms and navigate to Home', async () => {
    // Terms screen
    const termsScreen = await $('~TermsOfUseScreen');
    await termsScreen.waitForDisplayed({ timeout: 60000 });

    const termsRow = await $('~TermsAgreeRow');
    await termsRow.click();

    const privacyRow = await $('~PrivacyAgreeRow');
    await privacyRow.click();

    const continueBtn = await $('~TermsContinueButton');
    await continueBtn.click();

    // Onboarding
    const onboardingScreen = await $('~OnboardingScreen');
    await onboardingScreen.waitForDisplayed({ timeout: 30000 });

    const getStarted = await $('~OnboardingGetStartedButton');
    await getStarted.click();

    // Home
    const homeScreen = await $('~HomeScreen');
    await homeScreen.waitForDisplayed({ timeout: 30000 });

    expect(await homeScreen.isDisplayed()).to.equal(true);
  });
});
