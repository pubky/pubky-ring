import { showSheet } from '../sheets/sheetNavigation.tsx';
import { EBackupPreference } from '../types/pubky.ts';
import { getPubkySecretKey } from './pubky.ts';
import { showToast } from './helpers.ts';
import { getBackupPreference } from './store-helpers.ts';
import i18n from '../i18n';
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
		const secretKeyResponse = await getPubkySecretKey(pubky);
		if (secretKeyResponse.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('common.error'),
				description: i18n.t('backup.couldNotRetrieveSecretKey'),
			});
			return undefined;
		}

		if (secretKeyResponse.value?.mnemonic) {
			return {
				screen: 'RecoveryPhraseScreen',
				params: {
					pubky,
					mnemonic: secretKeyResponse.value.mnemonic,
				},
			};
		}

		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: i18n.t('backup.couldNotRetrieveSecretKey'),
		});
		return undefined;
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
	const params = await createBackupInitialScreenParams({ pubky, backupPreference });

	if (!params) {
		return;
	}

	showSheet('backup', params);
};
