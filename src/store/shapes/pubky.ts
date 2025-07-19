import { EBackupPreference, Pubky, PubkyState } from '../../types/pubky.ts';

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
};
