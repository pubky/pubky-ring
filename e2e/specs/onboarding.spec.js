const { completeOnboardingFlow } = require('../helpers/actions');

/**
 * Basic onboarding flow:
 * 1) Accept both checkboxes on Terms screen, tap Continue.
 * 2) On Onboarding screen, check Get Started button is displayed, tap it.
 * 3) On Home screen, check Add Pubky button is displayed.
 */

describe('Onboarding flow', () => {

	it('can accept terms and navigate to Home', async () => {
		await completeOnboardingFlow();
		// TODO: add check for pubky placeholder
	});
});
