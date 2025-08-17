import { EBackupPreference, Pubky, PubkyState, TProfile } from '../../types/pubky.ts';

export const initialState: PubkyState = {
	pubkys: {},
	deepLink: '',
};

export const defaultPubkyState: Pubky = {
	name: '',
	homeserver: '',
	signupToken: '',
	signedUp: false,
	image: '',
	sessions: [],
	backupPreference: EBackupPreference.encryptedFile,
	isBackedUp: false
};

export const defaultProfile: TProfile = {
	name: "",
	bio: "",
	image: "",
	links: [],
};
