import { EBackupPreference, Pubky, PubkyState, TProfile } from '../../types/pubky.ts';

export const initialState: PubkyState = {
	pubkys: {},
	deepLink: '',
	processing: {},
	pendingSessionCleanup: {},
};

export const defaultPubkyState: Pubky = {
	name: '',
	homeserver: '',
	signupToken: '',
	signedUp: false,
	image: '',
	sessions: [],
	backupPreference: EBackupPreference.encryptedFile,
	isBackedUp: false,
	sourceApp: 'app.pubkyring',
};

export const defaultProfile: TProfile = {
	name: '',
	bio: '',
	image: '',
	links: [],
};
