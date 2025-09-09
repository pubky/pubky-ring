/**
 * Requests an invite code from the homeserver admin API
 * 
 * Requires HOMESERVER_ADMIN_PASSWORD environment variable to be set
 * 
 * @returns Promise<string> The invite code/token
 * @throws Error if the request fails or admin password is not set
 */
export async function requestInviteCode(url?: string): Promise<string> {
	const adminPassword = process.env.HOMESERVER_ADMIN_PASSWORD;
	
	if (!adminPassword) {
		throw new Error('HOMESERVER_ADMIN_PASSWORD environment variable is required');
	}

	if (!url) {
		url = 'https://admin.homeserver.staging.pubky.app/generate_signup_token';
	}
	
	try {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'X-Admin-Password': adminPassword,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
		}

		const inviteCode = await response.text();
		
		if (!inviteCode || inviteCode.trim() === '') {
			throw new Error('Empty invite code received from server');
		}

		return inviteCode.trim();
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to request invite code: ${error.message}`);
		}
		throw new Error('Failed to request invite code: Unknown error');
	}
}
