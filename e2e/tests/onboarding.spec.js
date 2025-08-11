const { expect } = require('chai');

describe('Onboarding', () => {
  it('shows onboarding and navigates to home on Get Started', async () => {
    const onboardingScreen = await $('~OnboardingScreen');
    await onboardingScreen.waitForDisplayed({ timeout: 20000 });

    const getStarted = await $('~OnboardingGetStartedButton');
    await getStarted.waitForDisplayed({ timeout: 10000 });
    await getStarted.click();

    const homeScreen = await $('~HomeScreen');
    await homeScreen.waitForDisplayed({ timeout: 20000 });
    expect(await homeScreen.isDisplayed()).to.equal(true);
  });
});


