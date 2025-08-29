import type { ChainablePromiseElement } from 'webdriverio';

export function elementById(selector: string): ChainablePromiseElement {
	if (driver.isAndroid) {
		return $(`android=new UiSelector().resourceId("${selector}")`);
	} else {
		return $(`~${selector}`);
	}
}

export function waitForDisplayed(element: ChainablePromiseElement, timeout?: number, interval: number = 1000): Promise<boolean> {
	return element.waitForDisplayed({ timeout, interval });
}