import { Pubky, PubkyState } from '../../types/pubky.ts';

export const initialState: PubkyState = {
	pubkys: {},
};

export const defaultPubkyState: Pubky = {
	name: '',
	homeserver: 'ufibwbmed6jeq9k4p583go95wofakh9fwpp4k734trq79pd9u1uy',
	signedUp: false,
	image: '',
	sessions: [],
};
