export function elementByText(text) {
    if (driver.isAndroid) {
        return $(`android=new UiSelector().textContains("${text}")`);
    } else {
        return $(`~test`);
    }
}

export const sleep = (ms) => browser.pause(ms);

describe('Onboarding flow', () => {
    it('should accept terms and navigate to Home', async () => {
		sleep(20000);
        const t = await elementByText("I declare that I have read and accept the terms of use.").click();
        const p = await elementByText("I declare that I have read and accept the privacy policy.").click();
        const r = await elementByText("Continue").click();
    });
});
