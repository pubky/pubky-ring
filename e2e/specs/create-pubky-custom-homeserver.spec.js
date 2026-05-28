const { expect } = require('chai');
const {
	elementById,
	waitForDisplayed,
	completeOnboardingFlow,
	enterText,
	dismissKeyboard,
} = require('../helpers/actions');
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
		const pubkyBoxTestID = `PubkyBox-${pubkyName.replace(/[^a-zA-Z0-9]/g, '')}-0`;

		// Tap 'Add pubky' button on Home page
		(await waitForDisplayed(elementById('AddPubkyButton'))).click();

		// Tap 'New pubky' on Add Pubky page button
		(await waitForDisplayed(elementById('NewPubkyButton'))).click();

		// TODO: consider copying the pubky to clipboard

		// Tap 'Continue' button on New Pubky page
		(await waitForDisplayed(elementById('NewPubkyContinueButton'))).click();

		// Tap 'Custom' option on Homeserver page
		(await waitForDisplayed(elementById('HomeserverCustomOption'))).click();

		// Assert that 'Custom' option is selected on Homeserver page
		await waitForDisplayed(elementById('HomeserverCustomRadioInner'));
		expect(await elementById('HomeserverDefaultRadioInner').isExisting()).to.be.false;

		// Tap 'Continue' button on Homeserver page
		(await waitForDisplayed(elementById('HomeserverContinueButton'))).click();

		// Input name for pubky
		await enterText(elementById('EditPubkyNameInput'), pubkyName);
		expect(await elementById('EditPubkyNameInput').getText()).to.equal(pubkyName);

		// Input invite code for staging homeserver
		await enterText(elementById('EditPubkyInviteCodeInput'), inviteCodeWithoutHyphens, inviteCode);
		expect(await elementById('EditPubkyInviteCodeInput').isDisplayed()).to.be.true;

		// Replace default homeserver pubky with staging homeserver pubky
		const homeserverInput = await waitForDisplayed(elementById('EditPubkyHomeserverInput'));
		await enterText(homeserverInput, stagingHomeserver);
		expect(await elementById('EditPubkyHomeserverInput').getText()).to.equal(stagingHomeserver);
		await dismissKeyboard(elementById('edit-pubky-label'));

		// Tap 'Save' button on Edit Pubky page
		const saveButton = await waitForDisplayed(elementById('EditPubkySaveButton'), 30_000);
		expect(await saveButton.isEnabled()).to.be.true;
		await saveButton.click();

		// Assert the new pubky appears on the home screen at index 0
		const pubkyBox = elementById(pubkyBoxTestID);
		const newPubkyBox = await waitForDisplayed(pubkyBox, 120_000);
		expect(await newPubkyBox.isExisting()).to.be.true;
	});
});
