import { createSelector } from '@reduxjs/toolkit';
import { Pubky, PubkySession } from '../../types/pubky';
import { RootState } from '../../types';
import { truncateStr } from '../../utils/pubky.ts';

/**
 * Get a specific pubky by its identifier
 */
export const getPubky = (state: RootState, pubky: string): Pubky => {
	return state.pubky.pubkys[pubky];
};

const selectAllPubkys = (state: RootState): { [key: string]: Pubky } => state.pubky.pubkys;

/**
 * Returns all signed up pubkys
 * @param state
 */
export const getSignedUpPubkys = createSelector(
	[selectAllPubkys],
	(allPubkys): { [key: string]: Pubky } => {
		const signedUpPubkys: { [key: string]: Pubky } = {};

		for (const key in allPubkys) {
			const pubky = allPubkys[key];
			if (pubky?.signedUp) {
				signedUpPubkys[key] = pubky;
			}
		}

		return signedUpPubkys;
	}
);

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

/**
 * Get all pubkys as an array
 */
export const getAllPubkysArray = createSelector(
	[selectAllPubkys],
	(pubkys): Array<{ key: string; value: Pubky }> => {
		return Object.entries(pubkys).map(([key, value]) => ({
			key,
			value,
		}));
	}
);

export const getHasPubkys = (state: RootState): boolean => {
	return Object.keys(state.pubky.pubkys).length > 0;
};

/**
 * Get all pubky keys (pubky identifiers)
 */
export const getPubkyKeys = (state: RootState): string[] => {
	return Object.keys(state.pubky.pubkys);
};

/**
 * Combined selector for HomeScreen to reduce re-renders
 */
export const getHomeScreenData = createSelector(
	[getAllPubkysArray, getHasPubkys],
	(pubkyArray, hasPubkys) => ({
		pubkyArray,
		hasPubkys,
	})
);

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

export const isProcessing = (state: RootState, key: string): boolean => {
	return key in state.pubky.processing;
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
 * Get pubky name
 * If no name is set, returns "pubky #N" where N is the index + 1
 * Optionally truncates the name to displayLength characters
 * @param state Redux state
 * @param pubky Pubky identifier
 * @param displayLength Number of characters to display (default: 8)
 * @returns Truncated name or "pubky #N"
 */
export const getPubkyName = (state: RootState, pubky: string, displayLength = 8): string => {
	const pubkyData = state.pubky.pubkys[pubky];
	const pubkyIndex = getPubkyIndex(state, pubky);
	const name = pubkyData?.name;

	if (name) {
		return truncateStr(name, displayLength);
	}

	// Fall back to "pubky #N" if no name
	return `pubky #${pubkyIndex + 1}`;
};

/**
 * Get pubky homeserver
 */
export const getPubkyHomeserver = (state: RootState, pubky: string): string => {
	return state.pubky.pubkys[pubky]?.homeserver || '';
};

/**
 * Get the index of a pubky in the getPubkyKeys array
 * Returns -1 if the pubky is not found
 */
export const getPubkyIndex = (state: RootState, pubky: string): number => {
	const keys = getPubkyKeys(state);
	return keys.indexOf(pubky);
};
