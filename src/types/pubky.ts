export interface PubkySession {
	id: string;
	grant_id: string;
	capabilities: string[];
	created_at: number;
	// Retained only to retry a failed revocation, never used as an active session.
	cleanupOnly?: boolean;
	// Missing on legacy records; the pubky's current server is not a safe substitute.
	homeserver?: string;
}

export interface GrantInfo {
	grant_id: string;
	client_id: string;
	capabilities: string;
	issued_at: number;
	expires_at: number;
}

export interface Pubky {
	name: string;
	homeserver: string;
	// Account verified when Ring last signed out; distinct from a default/draft selection.
	lastKnownHomeserver?: string;
	signedUp: boolean;
	signupToken: string;
	image: string;
	sessions: PubkySession[];
	backupPreference: EBackupPreference;
	isBackedUp: boolean;
	// Set when another app owns the key and Ring only holds a reference to it.
	sourceApp?: string;
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
	preferredHomeserver?: string;
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
