const url =
  typeof HOMESERVER_INVITE_URL !== 'undefined' && HOMESERVER_INVITE_URL
    ? HOMESERVER_INVITE_URL
    : 'https://admin.homeserver.staging.pubky.app/generate_signup_token';
let inviteCode =
  typeof INVITE_CODE !== 'undefined' && INVITE_CODE ? INVITE_CODE.trim() : '';

if (!inviteCode) {
  const adminPassword =
    typeof HOMESERVER_ADMIN_PASSWORD !== 'undefined'
      ? HOMESERVER_ADMIN_PASSWORD.trim()
      : '';

  if (!adminPassword) {
    throw new Error('HOMESERVER_ADMIN_PASSWORD or INVITE_CODE is required');
  }

  const response = http.get(url, {
    headers: {
      'X-Admin-Password': adminPassword,
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to request invite code from ${url}: status ${response.status}`);
  }

  inviteCode = response.body.trim();
}

if (!inviteCode) {
  throw new Error('Empty invite code received from server');
}

output.INVITE_CODE = inviteCode;
output.INVITE_CODE_WITHOUT_HYPHENS = inviteCode.replace(/-/g, '');
