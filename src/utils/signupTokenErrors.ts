export const classifySignupTokenError = (message: string): 'required' | 'invalid' | 'used' | undefined => {
	if (!/token|invite code/i.test(message)) return undefined;
	if (/already used/i.test(message)) return 'used';
	if (/required/i.test(message)) return 'required';
	if (/invalid/i.test(message)) return 'invalid';
	return undefined;
};
