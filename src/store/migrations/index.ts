import { PersistedState } from 'redux-persist';
import { EBackupPreference } from '../../types/pubky';

const migrations = {
	// @ts-ignore
	1: (state): PersistedState => {
		return {
			...state,
			pubky: {
				...state.pubky,
				deepLink: '',
			},
		};
	},
	// @ts-ignore
	2: (state): PersistedState => {
		return {
			...state,
			settings: {
				...state.settings,
				signedTermsOfUse: false,
			},
		};
	},
	// @ts-ignore
	3: (state): PersistedState => {
		const updatedPubkys = { ...state.pubky.pubkys };

		// Add backupPreference to all existing pubkys
		Object.keys(updatedPubkys).forEach(pubkyKey => {
			if (!updatedPubkys[pubkyKey].backupPreference) {
				updatedPubkys[pubkyKey] = {
					...updatedPubkys[pubkyKey],
					backupPreference: EBackupPreference.encryptedFile,
				};
			}
		});

		return {
			...state,
			pubky: {
				...state.pubky,
				pubkys: updatedPubkys,
			},
		};
	},
	// @ts-ignore
	4: (state): PersistedState => {
		const updatedPubkys = { ...state.pubky.pubkys };

		// Add isBackedUp to all existing pubkys
		Object.keys(updatedPubkys).forEach(pubkyKey => {
			updatedPubkys[pubkyKey] = {
				...updatedPubkys[pubkyKey],
				isBackedUp: false,
			};
		});

		return {
			...state,
			pubky: {
				...state.pubky,
				pubkys: updatedPubkys,
			},
		};
	},
	// @ts-ignore
	5: (state): PersistedState => {
		return {
			...state,
			pubky: {
				...state.pubky,
				processing: {},
			},
		};
	},
};

export default migrations;
