import { claimInitialUrl, resetClaimedInitialUrl } from '../src/utils/initialUrl';

const AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=abc123';
const OTHER_AUTH_URL = 'pubkyauth:///?caps=/pub/pubky.app:rw&relay=https://relay.example/link/&secret=def456';

describe('claimInitialUrl', () => {
	beforeEach(() => {
		resetClaimedInitialUrl();
	});

	it('claims a URL the first time it is seen', () => {
		expect(claimInitialUrl(AUTH_URL)).toBe(true);
	});

	it('rejects the same URL when it is read again in the same process', () => {
		expect(claimInitialUrl(AUTH_URL)).toBe(true);
		expect(claimInitialUrl(AUTH_URL)).toBe(false);
	});

	it('claims the same URL again in a new process', () => {
		expect(claimInitialUrl(AUTH_URL)).toBe(true);

		// A user retrying the same onboarding link after killing the app looks exactly like this.
		resetClaimedInitialUrl();
		expect(claimInitialUrl(AUTH_URL)).toBe(true);
	});

	it('claims a different URL after one was consumed', () => {
		claimInitialUrl(AUTH_URL);

		expect(claimInitialUrl(OTHER_AUTH_URL)).toBe(true);
		// The newest URL is now the one that is remembered.
		expect(claimInitialUrl(OTHER_AUTH_URL)).toBe(false);
		expect(claimInitialUrl(AUTH_URL)).toBe(true);
	});
});
