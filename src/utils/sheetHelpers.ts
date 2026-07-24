import { SheetManager } from 'react-native-actions-sheet';
import { defaultPubkyState } from '../store/shapes/pubky.ts';
import { EBackupPreference, Pubky } from '../types/pubky.ts';
import { getPubkySecretKey } from './pubky.ts';
import { showToast, generateBackupFileName } from './helpers.ts';
import { getBackupPreference, getStore } from './store-helpers.ts';
import { createRecoveryFile } from '@synonymdev/react-native-pubky';
import { SharedPubkyIdentity } from './sharedPubky.ts';
import { backupPubky } from './rnfs.ts';
import { err, ok } from '@synonymdev/result';
import i18n from '../i18n';
import { SHEET_ANIMATION_DELAY, SHEET_TRANSITION_DELAY } from './constants';

export const showReuseSharedPubkySheet = (identities: SharedPubkyIdentity[]): void => {
	void SheetManager.show('reuse-shared-pubky', { payload: { identities } });
};

export const showAddPubkySheet = (
	createPubky: () => void,
	importPubky: (mnemonic?: string) => Promise<any>,
	sharedIdentities: SharedPubkyIdentity[] = [],
): void => {
	SheetManager.show('add-pubky', {
		payload: { createPubky, importPubky, sharedIdentities },
	});
};

export const showNewPubkySetupSheet = ({
	pubky,
	data = { ...defaultPubkyState },
}: {
	pubky: string;
	data?: Pubky;
}): void => {
	SheetManager.show('new-pubky-setup', {
		payload: {
			pubky,
			data,
		},
	});
};

export const showEditPubkySheet = ({
	title = i18n.t('common.edit'),
	description = '',
	pubky,
	data = { ...defaultPubkyState },
}: {
	title?: string;
	description?: string;
	pubky: string;
	data?: Pubky;
}): void => {
	SheetManager.show('edit-pubky', {
		payload: {
			title,
			description,
			pubky,
			data,
		},
	});
};

export const showImportSuccessSheet = ({
	isNewPubky = true,
	pubky,
	onContinue = (): void => {},
}: {
	isNewPubky?: boolean;
	pubky: string;
	onContinue?: () => void;
}): void => {
	SheetManager.show('import-success', {
		payload: {
			isNewPubky,
			pubky,
			onContinue,
		},
	});
};

export const showImportSuccessUI = (pubky: string, isNewPubky: boolean): void => {
	setTimeout(() => {
		showImportSuccessSheet({
			pubky,
			isNewPubky,
			onContinue: () => {
				setTimeout(() => {
					showEditPubkySheet({
						title: 'Setup',
						pubky,
					});
				}, SHEET_TRANSITION_DELAY);
			},
		});
	}, SHEET_ANIMATION_DELAY);
};

export enum EBackupPromptViewId {
	backup = 'backup',
	import = 'import',
}

export const showBackupPrompt = async ({
	pubky,
	backupPreference,
	onComplete,
}: {
	pubky: string;
	backupPreference?: EBackupPreference;
	onComplete?: () => void;
}): Promise<void> => {
	if (getStore().pubky.pubkys[pubky]?.sourceApp === 'to.bitkit') {
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: i18n.t('reuseSharedPubky.source'),
		});
		return;
	}
	if (backupPreference === EBackupPreference.unknown) {
		SheetManager.show('select-backup-preference', {
			payload: {
				pubky,
			},
		});
		return;
	}

	const secretKeyResponse = await getPubkySecretKey(pubky);
	if (secretKeyResponse.isErr()) {
		showToast({
			type: 'error',
			title: i18n.t('common.error'),
			description: i18n.t('backup.couldNotRetrieveSecretKey'),
		});
		return;
	}

	if (!backupPreference) {
		backupPreference = getBackupPreference(pubky);
	}

	if (backupPreference === EBackupPreference.recoveryPhrase && secretKeyResponse.value?.mnemonic) {
		SheetManager.show('recovery-phrase-prompt', {
			payload: {
				pubky,
				mnemonic: secretKeyResponse.value.mnemonic,
			},
		});
		return;
	}

	SheetManager.show('backup-prompt', {
		payload: {
			viewId: EBackupPromptViewId.backup,
			pubky,
			onSubmit: async (passphrase: string) => {
				try {
					const createRecoveryFileRes = await createRecoveryFile(
						secretKeyResponse.value.secretKey,
						passphrase,
					);

					if (createRecoveryFileRes.isErr()) {
						showToast({
							type: 'error',
							title: i18n.t('common.error'),
							description: createRecoveryFileRes.error.message,
						});
						return err(createRecoveryFileRes.error.message);
					}

					let pubkyName;
					try {
						const name = getStore().pubky.pubkys[pubky]?.name;
						if (typeof name === 'string' && name.trim()) {
							pubkyName = name.toLowerCase().replace(/\s+/g, '-') + '-backup';
						}
					} catch {}

					const fileName = generateBackupFileName(pubkyName);
					const backupRes = await backupPubky(createRecoveryFileRes.value, fileName);

					if (backupRes.isErr()) {
						if (backupRes.error.message.includes('User canceled backup')) {
							return err('User canceled backup');
						}
						showToast({
							type: 'error',
							title: i18n.t('common.error'),
							description: backupRes.error.message,
						});
						return err(backupRes.error.message);
					} else {
						showToast({
							type: 'success',
							title: i18n.t('backup.backupCreated'),
							description: `${fileName}.pkarr`,
						});
						SheetManager.hide('backup-prompt').then();
						onComplete?.();
						return ok('Backup created successfully');
					}
				} catch (error) {
					console.error('Backup creation error:', error);
					showToast({
						type: 'error',
						title: i18n.t('common.error'),
						description: i18n.t('backup.failedToCreateBackup'),
					});
					return err(i18n.t('backup.failedToCreateBackup'));
				}
			},
		},
	});
};

export const hideAllSheets = async (): Promise<void> => {
	await SheetManager.hideAll();
};
