export interface PubkySession {
	pubky: string;
	capabilities: string[];
	created_at: number;
}

export interface Pubky {
	name: string;
	homeserver: string;
	signedUp: boolean;
	signupToken: string;
	image: string;
	sessions: PubkySession[];
	backupPreference: EBackupPreference;
	isBackedUp: boolean;
}

export type ISetPubkyData = Partial<Pubky>;

export interface PubkyState {
	pubkys: TPubkys
	deepLink: string;
}

export type TPubkys = {
	[key: string]: Pubky
};

export interface IKeychainData {
	secretKey: string;
	mnemonic: string;
}

export enum EBackupPreference {
	recoveryPhrase = 'recoveryPhrase',
	encryptedFile = 'encryptedFile',
	unknown = 'unknown',
}

export type TProfile = {
	name: string;
	bio: string;
	image: string;
	links: {
		title: string;
		url: string;
	}[];
};
