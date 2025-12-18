import { SheetManager } from 'react-native-actions-sheet';
import { defaultPubkyState } from "../store/shapes/pubky.ts";
import { EBackupPreference, Pubky } from "../types/pubky.ts";
import { getPubkySecretKey } from './pubky.ts';
import { showToast, generateBackupFileName } from './helpers.ts';
import { getBackupPreference, getStore } from './store-helpers.ts';
import { EBackupPromptViewId } from '../components/BackupPrompt.tsx';
import { createRecoveryFile } from '@synonymdev/react-native-pubky';
import { backupPubky } from './rnfs.ts';
import { err, ok } from '@synonymdev/result';
import i18n from '../i18n';

export const showAddPubkySheet = (
	createPubky: () => void,
	importPubky: (mnemonic?: string) => Promise<any>,
): void => {
	SheetManager.show('add-pubky', {
		payload: { createPubky, importPubky },
		onClose: () => SheetManager.hide('add-pubky'),
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
		onClose: () => SheetManager.hide('new-pubky-setup'),
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
		onClose: () => SheetManager.hide('edit-pubky'),
	});
};

export const showImportSuccessSheet = ({
	modalTitle = i18n.t('import.pubkyImported'),
	description,
	isNewPubky = true,
	pubky,
	data = { ...defaultPubkyState },
	onContinue = (): void => {},
}: {
	modalTitle?: string;
	description?: string;
	isNewPubky?: boolean;
	pubky: string;
	data?: Pubky;
	onContinue?: () => void;
}): void => {
	SheetManager.show('import-success', {
		payload: {
			modalTitle,
			description,
			isNewPubky,
			pubky,
			data,
			onContinue
		},
		onClose: () => SheetManager.hide('import-success'),
	});
};

export const showBackupPrompt = async ({
	pubky,
	backupPreference,
	onComplete,
}: {
	pubky: string,
	backupPreference?: EBackupPreference;
	onComplete?: () => void
}): Promise<void> => {
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

	if (
		backupPreference === EBackupPreference.recoveryPhrase &&
		secretKeyResponse.value?.mnemonic
	) {
		SheetManager.show('recovery-phrase-prompt', {
			payload: {
				pubky,
				mnemonic: secretKeyResponse.value.mnemonic,
				onClose: () => SheetManager.hide('recovery-phrase-prompt'),
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
						passphrase
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
			onClose: () => SheetManager.hide('backup-prompt'),
		},
	});
};

export const hideAllSheets = async (): Promise<void> => {
	await SheetManager.hideAll();
};
