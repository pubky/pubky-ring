export interface PubkySession {
	pubky: string;
	capabilities: string[];
	created_at: number;
}

export interface Pubky {
	name: string;
	homeserver: string;
	signedUp: boolean;
	image: string;
	sessions: PubkySession[];
}

export interface PubkyState {
	pubkys: TPubkys
}

export type TPubkys = {
	[key: string]: Pubky
};
