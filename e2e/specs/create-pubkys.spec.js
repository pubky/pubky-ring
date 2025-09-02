const { expect } = require('chai');
const { elementById, waitForDisplayed, completeOnboardingFlow, dismissKeyboard, waitForKeyboardToBeShown, sendReturnKey } = require('../helpers/actions');


before(async () => {
  await completeOnboardingFlow();
});

describe('Create a pubky flow', () => {

  it('can go to create a pubky with default (prod) homeserver without proceeding to input invite code', async () => {
    // Tap 'Add pubky' button on Home page
    (await waitForDisplayed(elementById('EmptyStateAddPubkyButton'))).click();

    // Tap 'New pubky' on Add Pubky page button
    (await waitForDisplayed(elementById('NewPubkyButton'))).click();

    // TODO: consider copying the pubky to clipboard

    // Tap 'Continue' button on New Pubky page
    (await waitForDisplayed(elementById('NewPubkyContinueButton'))).click();

    // Assert that 'Default' option is selected on Homeserver page
    (await waitForDisplayed(elementById('HomeserverDefaultRadioInner')));
    expect(await elementById('HomeserverCustomRadioInner').isExisting()).to.be.false;

    // Tap 'Continue' button on Homeserver page
    (await waitForDisplayed(elementById('HomeserverContinueButton'))).click();

    // Assert that 'Continue' button on Default Homeserver page is disabled
    await dismissKeyboard();
    const inviteCodeContinueButton = await waitForDisplayed(elementById('InviteCodeContinueButton'));
    expect(await inviteCodeContinueButton.isEnabled()).to.be.false;

    // TODO: consider testing input validation with invalid and partial input invite code

    // Input an invite code on Default Homeserver page
    (await waitForDisplayed(elementById('InviteCodeInput'))).click();
    await waitForKeyboardToBeShown();
    driver.sendKeys(['ABCD1234EFGH']);
    expect(await elementById('InviteCodeInput').getText()).to.equal('ABCD-1234-EFGH');

    // note: unable to assert that 'Continue' button is enabled because keyboard dismissal uses return key on iOS and that submits the form
    await sendReturnKey();

    // Assert that 'Continue' button on Default Homeserver page changes to 'Processing'
    const inviteCodeContinueButtonText = await waitForDisplayed(elementById('InviteCodeContinueButtonText'));
    expect(await inviteCodeContinueButtonText.getText()).to.contain('Processing');

    // TODO: Assert for error because we input an invalid invite code for prod homeserver
    (await waitForDisplayed(elementById('InviteCodeErrorText'), 120_000));
    expect(await elementById('InviteCodeErrorText').getText()).to.contain('Invalid invite code');
  });

  it.skip('can create a pubky with a custom homeserver (stag) with valid invite code', async () => {});
});
