import { showSheet } from '../sheets/sheetNavigation.tsx';
import { EBackupPreference } from '../types/pubky.ts';
import { getBackupPreference, getPubkyDataFromStore } from './store-helpers.ts';
import type { BackupSheetParams } from '../sheets/types.ts';

type BackupPreferenceChoice = EBackupPreference.encryptedFile | EBackupPreference.recoveryPhrase;
type BackupDestinationParams = Extract<
	BackupSheetParams,
	{ screen: 'BackupFileScreen' | 'RecoveryPhraseScreen' }
>;

export const createBackupDestinationParams = async ({
	pubky,
	backupPreference,
}: {
	pubky: string;
	backupPreference: BackupPreferenceChoice;
}): Promise<BackupDestinationParams | undefined> => {
	if (backupPreference === EBackupPreference.recoveryPhrase) {
		return { screen: 'RecoveryPhraseScreen', params: { pubky } };
	}

	return {
		screen: 'BackupFileScreen',
		params: { pubky },
	};
};

const createBackupInitialScreenParams = async ({
	pubky,
	backupPreference,
}: {
	pubky: string;
	backupPreference?: EBackupPreference;
}): Promise<BackupSheetParams | undefined> => {
	const resolvedPreference = backupPreference ?? getBackupPreference(pubky);

	if (resolvedPreference === EBackupPreference.unknown) {
		return {
			screen: 'BackupPreferenceScreen',
			params: { pubky },
		};
	}

	return createBackupDestinationParams({ pubky, backupPreference: resolvedPreference });
};

export const showBackupSheet = async ({
	pubky,
	backupPreference,
}: {
	pubky: string;
	backupPreference?: EBackupPreference;
}): Promise<void> => {
	// A pubky owned by another app must never be exported from Ring.
	if (getPubkyDataFromStore(pubky)?.sourceApp) {
		return;
	}

	const params = await createBackupInitialScreenParams({ pubky, backupPreference });

	if (!params) {
		return;
	}

	showSheet('backup', params);
};
