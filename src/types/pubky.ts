export interface PubkySession {
	pubky: string;
	capabilities: string[];
	created_at: number;
}

export interface Pubky {
	name: string;
	homeserver: string;
	image: string;
	sessions: PubkySession[];
}

export interface PubkyState {
	pubkys: {
		[key: string]: Pubky
	}
}
