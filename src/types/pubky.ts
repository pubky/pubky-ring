export interface PubkySession {
	pubky: string;
	capabilities: string[];
	session_secret: string;
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

export interface Homeserver {
	name: string;
	publicKey: string;
}

export type THomeservers = {
	[publicKey: string]: Homeserver;
};

export type ISetPubkyData = Partial<Pubky>;

export interface PubkyState {
	pubkys: TPubkys;
	homeservers: THomeservers;
	deepLink: string;
	processing: { [key: string]: boolean };
}

export type TPubkys = {
	[key: string]: Pubky;
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
