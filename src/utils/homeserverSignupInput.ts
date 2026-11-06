import { InputAction, parseInput, type InputSource } from './inputParser';
import { isSynonymHomeserver, normalizeHomeserver } from './homeservers';

export type HomeserverSignupDraft = { homeserver: string; inviteCode: string };
export type HomeserverSignupInputResult =
	| { success: true; draft: HomeserverSignupDraft }
	| { success: false; reason: 'invalid' | 'authorization' | 'selectServer' };

/** Decode an invite into a draft only. Never route it through new-key onboarding. */
export const parseHomeserverSignupInput = async (
	input: string,
	source: InputSource,
	selectedHomeserver: string,
): Promise<HomeserverSignupInputResult> => {
	const parsed = await parseInput(input, source);
	if (parsed.data.action === InputAction.Signup || parsed.data.action === InputAction.Auth) {
		return { success: false, reason: 'authorization' };
	}
	if (parsed.data.action === InputAction.DirectSignup) {
		const homeserver = normalizeHomeserver(parsed.data.params.homeserver);
		if (!homeserver) return { success: false, reason: 'invalid' };
		return { success: true, draft: { homeserver, inviteCode: parsed.data.params.inviteCode } };
	}
	if (parsed.data.action === InputAction.Invite) {
		const homeserver = normalizeHomeserver(selectedHomeserver);
		if (!homeserver) return { success: false, reason: 'selectServer' };
		return { success: true, draft: { homeserver, inviteCode: parsed.data.params.inviteCode } };
	}
	// Custom servers define their own token syntax. Preserve opaque pasted/scanned tokens.
	if (
		parsed.data.action === InputAction.Unknown &&
		input.trim() &&
		!input.includes('://') &&
		!/^(pubky|pubkyring|pubkyauth|pk):/i.test(input.trim())
	) {
		const homeserver = normalizeHomeserver(selectedHomeserver);
		if (homeserver && !isSynonymHomeserver(homeserver))
			return { success: true, draft: { homeserver, inviteCode: input.trim() } };
	}
	return { success: false, reason: 'invalid' };
};
