//const { expect } = require('chai');

export function elementByText(text) {
    if (driver.isAndroid) {
        return $(`android=new UiSelector().textContains("${text}")`);
    } else {
        return $(`~test`);
    }
}

export function elementByID(id) {
    if (driver.isAndroid) {
        return $(`android=new UiSelector().resourceId("${id}")`);
    } else {
        return $(`~test`);
    }
}

export const sleep = (ms) => browser.pause(ms);

describe('Onboarding flow', () => {
    it('should accept terms and navigate to Home', async () => {
        const t = await elementByText("I declare that I have read and accept the terms of use.").click();
        const p = await elementByText("I declare that I have read and accept the privacy policy.").click();
        //const t = await elementByText("I declare that I have read and accept the terms of use.");
        //const p = await $('~TermsContinueButton');
        //console.log(p)
//		const termsScreen = await $('~TermsContinueButton');
		//await termsScreen.waitForDisplayed({ interval: 5000, timeout: 60000 });
//		console.log(termsScreen)
        //console.log(elementsList)
        //const r = await elementByText("Continue").click();
//		const termsRow = await $('~TermsAgreeRow');
//		await termsRow.click();

//		const privacyRow = await $('~PrivacyAgreeRow');
//		await privacyRow.click();
//
//		const continueBtn = await $('~TermsContinueButton');
//		await continueBtn.click();

		//const onboardingGetStartedButton = await $('~OnboardingGetStartedButton');
    });
});
