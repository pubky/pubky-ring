const { expect } = require('chai');
const { elementById, waitForDisplayed, completeOnboardingFlow, dismissKeyboard, waitForKeyboardToBeShown, takeScreenshot } = require('../helpers/actions');
const { requestInviteCode } = require('../helpers/requests');


before(async () => {
	await completeOnboardingFlow();
});

describe('create a pubky with a custom homeserver (stag) with valid invite code', () => {

	it('can create a pubky with a custom homeserver (stag) with valid invite code', async () => {
		const inviteCode = await requestInviteCode();
		const inviteCodeWithoutHyphens = inviteCode.replace(/-/g, '');
		const stagingHomeserver = 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy';
		const pubkyName = 'Staging Test Pubky';

		// Tap 'Add pubky' button on Home page
    await driver.pause(1_000);
		await takeScreenshot('before-add-pubky-button');
		(await waitForDisplayed(elementById('EmptyStateAddPubkyButton'))).click();

		// Tap 'New pubky' on Add Pubky page button
    await driver.pause(1_000);
		await takeScreenshot('before-new-pubky-button');
		(await waitForDisplayed(elementById('NewPubkyButton'))).click();

		// TODO: consider copying the pubky to clipboard

		// Tap 'Continue' button on New Pubky page
    await driver.pause(1_000);
		await takeScreenshot('before-wait-new-pubky-continue-button');
		const newPubkyContinueButton = await waitForDisplayed(elementById('NewPubkyContinueButton'));
    await takeScreenshot('before-click-new-pubky-continue-button');
		await newPubkyContinueButton.click();

		// Tap 'Custom' option on Homeserver page
    await driver.pause(1_000);
		await takeScreenshot('before-homeserver-custom-option');
		(await waitForDisplayed(elementById('HomeserverCustomOption'))).click();

		// Assert that 'Custom' option is selected on Homeserver page
    await driver.pause(1_000);
		await takeScreenshot('before-homeserver-custom-radio-inner');
		(await waitForDisplayed(elementById('HomeserverCustomRadioInner')));
		await expect(await elementById('HomeserverDefaultRadioInner').isExisting()).to.be.false;

		// Tap 'Continue' button on Homeserver page
    await driver.pause(1_000);
		await takeScreenshot('before-homeserver-continue-button');
		(await waitForDisplayed(elementById('HomeserverContinueButton'))).click();

		// Input name for pubky
    await driver.pause(1_000);
		await takeScreenshot('before-name-input');
		(await waitForDisplayed(elementById('EditPubkyNameInput'))).click();
		await waitForKeyboardToBeShown();
		await driver.sendKeys([pubkyName]);
		await expect(await elementById('EditPubkyNameInput').getText()).to.equal(pubkyName);

		// Input invite code for staging homeserver
    await driver.pause(1_000);
		await takeScreenshot('before-invite-code-input');
		(await waitForDisplayed(elementById('EditPubkyInviteCodeInput'))).click();
		await waitForKeyboardToBeShown();
		await driver.sendKeys([inviteCodeWithoutHyphens]);
		await expect(await elementById('EditPubkyInviteCodeInput').getText()).to.equal(inviteCode);

		// Replace default homeserver pubky with staging homeserver pubky 
    await driver.pause(1_000);
		await takeScreenshot('before-homeserver-input');
		await dismissKeyboard(elementById('EditPubkyTitle'));
		const homeserverInput = await waitForDisplayed(elementById('EditPubkyHomeserverInput'));
		await homeserverInput.click();
		await waitForKeyboardToBeShown();
		await homeserverInput.clearValue();
		await driver.sendKeys([stagingHomeserver]);
		await expect(await elementById('EditPubkyHomeserverInput').getText()).to.equal(stagingHomeserver);

		// Tap 'Save' button on Edit Pubky page
    await driver.pause(1_000);
		await takeScreenshot('before-edit-pubky-save-button');
		(await waitForDisplayed(elementById('EditPubkySaveButton'))).click();

		// Assert successful homeserver signup
		await takeScreenshot('before-edit-pubky-success-check-mark-image');
		const successImage = await waitForDisplayed(elementById('EditPubkySuccessCheckMarkImage'), 120_000);
		await expect(await successImage.isExisting()).to.be.true;
		await takeScreenshot('after-edit-pubky-success-check-mark-image');

		// Tap 'Close' button on Edit Pubky page
    await driver.pause(1_000);
		await takeScreenshot('before-edit-pubky-left-button');
		const leftButton = await waitForDisplayed(elementById('EditPubkyLeftButton'));
		const leftButtonText = elementById('EditPubkyLeftButton-Text');
		await expect(await leftButton.isEnabled()).to.be.true;
		await expect(await leftButtonText.getText()).to.equal('Close');
		await leftButton.click();

		// Assert the new pubky appears on the home screen at index 0
    await driver.pause(1_000);
		await takeScreenshot('before-pubky-box-test-id');
		const pubkyBoxTestID = `PubkyBox-${pubkyName.replace(/[^a-zA-Z0-9]/g, '')}-0`;
		const newPubkyBox = await waitForDisplayed(elementById(pubkyBoxTestID));
		await expect(await newPubkyBox.isExisting()).to.be.true;
	});
});
