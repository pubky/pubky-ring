import { EBackupPreference, Homeserver, Pubky, PubkyState, TProfile } from '../../types/pubky.ts';
import { DEFAULT_HOMESERVER } from '../../utils/constants.ts';

export const defaultHomeserver: Homeserver = {
	name: 'Synonym',
	publicKey: DEFAULT_HOMESERVER,
};

export const initialState: PubkyState = {
	pubkys: {},
	homeservers: {
		[defaultHomeserver.publicKey]: defaultHomeserver,
	},
	deepLink: '',
	processing: {},
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
};

export const defaultProfile: TProfile = {
	name: '',
	bio: '',
	image: '',
	links: [],
};
