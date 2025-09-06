const { expect } = require('chai');
const { elementById, waitForDisplayed, completeOnboardingFlow, dismissKeyboard, waitForKeyboardToBeShown } = require('../helpers/actions');
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
		(await waitForDisplayed(elementById('EmptyStateAddPubkyButton'))).click();

		// Tap 'New pubky' on Add Pubky page button
		(await waitForDisplayed(elementById('NewPubkyButton'))).click();

		// TODO: consider copying the pubky to clipboard

		// Tap 'Continue' button on New Pubky page
		(await waitForDisplayed(elementById('NewPubkyContinueButton'))).click();

		// Tap 'Custom' option on Homeserver page
		(await waitForDisplayed(elementById('HomeserverCustomOption'))).click();

		// Assert that 'Custom' option is selected on Homeserver page
		(await waitForDisplayed(elementById('HomeserverCustomRadioInner')));
		expect(await elementById('HomeserverDefaultRadioInner').isExisting()).to.be.false;

		// Tap 'Continue' button on Homeserver page
		(await waitForDisplayed(elementById('HomeserverContinueButton'))).click();

		// Input name for pubky
		(await waitForDisplayed(elementById('EditPubkyNameInput'))).click();
		await waitForKeyboardToBeShown();
		await driver.sendKeys([pubkyName]);
		expect(await elementById('EditPubkyNameInput').getText()).to.equal(pubkyName);

		// Input invite code for staging homeserver
		(await waitForDisplayed(elementById('EditPubkyInviteCodeInput'))).click();
		await waitForKeyboardToBeShown();
		await driver.sendKeys([inviteCodeWithoutHyphens]);
		expect(await elementById('EditPubkyInviteCodeInput').getText()).to.equal(inviteCode);

		// Replace default homeserver pubky with staging homeserver pubky 
		await dismissKeyboard(elementById('EditPubkyTitle'));
		const homeserverInput = await waitForDisplayed(elementById('EditPubkyHomeserverInput'));
		await homeserverInput.click();
		await waitForKeyboardToBeShown();
		await homeserverInput.clearValue();
		await driver.sendKeys([stagingHomeserver]);
		expect(await elementById('EditPubkyHomeserverInput').getText()).to.equal(stagingHomeserver);

		// Tap 'Save' button on Edit Pubky page
		(await waitForDisplayed(elementById('EditPubkySaveButton'))).click();

		// Assert successful homeserver signup
		const successImage = await waitForDisplayed(elementById('EditPubkySuccessCheckMarkImage'), 120_000);
		expect(await successImage.isExisting()).to.be.true;

		// Tap 'Close' button on Edit Pubky page
		const leftButton = await waitForDisplayed(elementById('EditPubkyLeftButton'));
		const leftButtonText = elementById('EditPubkyLeftButton-Text');
		expect(await leftButton.isEnabled()).to.be.true;
		expect(await leftButtonText.getText()).to.equal('Close');
		await leftButton.click();

		// Assert the new pubky appears on the home screen at index 0
		const pubkyBoxTestID = `PubkyBox-${pubkyName.replace(/[^a-zA-Z0-9]/g, '')}-0`;
		const newPubkyBox = await waitForDisplayed(elementById(pubkyBoxTestID));
		expect(await newPubkyBox.isExisting()).to.be.true;
	});
});
