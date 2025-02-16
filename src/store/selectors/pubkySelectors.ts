import { Pubky, PubkySession } from '../../types/pubky';
import { RootState } from '../../types';

/**
 * Get a specific pubky by its identifier
 */
export const getPubky = (state: RootState, pubky: string): Pubky => {
	return state.pubky.pubkys[pubky];
};

/**
 * Returns if a pubky is signed up to the set homeserver
 */
export const isPubkySignedUp = (state: RootState, pubky: string): boolean => {
	return state.pubky.pubkys[pubky]?.signedUp || false;
};

/**
 * Get all pubkys
 */
export const getAllPubkys = (state: RootState): { [key: string]: Pubky } => {
	return state.pubky.pubkys;
};

export const getDeepLink = (state: RootState): string => {
	return state.pubky.deepLink;
};

/**
 * Get pubky sessions
 */
export const getPubkySessions = (state: RootState, pubky: string): PubkySession[] => {
	return state.pubky.pubkys[pubky]?.sessions || [];
};

/**
 * Get total number of sessions for a pubky
 */
export const getPubkySessionCount = (state: RootState, pubky: string): number => {
	return state.pubky.pubkys[pubky]?.sessions.length || 0;
};

/**
 * Check if a pubky exists
 */
export const hasPubky = (state: RootState, pubky: string): boolean => {
	return !!state.pubky.pubkys[pubky];
};

/**
 * Get total number of pubkys
 */
export const getPubkyCount = (state: RootState): number => {
	return Object.keys(state.pubky.pubkys).length;
};

/**
 * Get pubky image
 */
export const getPubkyImage = (state: RootState, pubky: string): string => {
	return state.pubky.pubkys[pubky]?.image || '';
};

/**
 * Get pubky homeserver
 */
export const getPubkyHomeserver = (state: RootState, pubky: string): string => {
	return state.pubky.pubkys[pubky]?.homeserver || '';
};
