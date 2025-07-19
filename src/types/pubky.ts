export interface PubkySession {
	pubky: string;
	capabilities: string[];
	created_at: number;
}

export interface ISetPubkyData {
	name?: string;
	homeserver?: string;
	signedUp?: boolean;
	signupToken?: string;
	image?: string;
	sessions?: PubkySession[];
}

export interface Pubky {
	name: string;
	homeserver: string;
	signedUp: boolean;
	signupToken: string;
	image: string;
	sessions: PubkySession[];
	backupPreference: EBackupPreference;
}

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
}
