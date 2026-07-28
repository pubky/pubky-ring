import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Result, err, ok } from '@synonymdev/result';
import { mnemonicPhraseToKeypair, IGenerateSecretKey } from '@synonymdev/react-native-pubky';
import { importPubky as importPubkyUtil } from '../utils/pubky';
import { isSecretKeyImport, showToast } from '../utils/helpers';
import { setPubkyData } from '../store/slices/pubkysSlice';
import { EBackupPreference } from '../types/pubky';
import { getStore } from '../utils/store-helpers.ts';
import { getPubkyKeys } from '../store/selectors/pubkySelectors';
import { useTranslation } from 'react-i18next';

export type ImportedPubky = {
	pubky: string;
	isNewPubky: boolean;
};

export const usePubkyManagement = (): {
	importPubky: (data: string) => Promise<Result<ImportedPubky>>;
	confirmPubkyBackup: (pubky: string, backupPreference: EBackupPreference) => void;
} => {
	const dispatch = useDispatch();
	const { t } = useTranslation();

	const importPubky = useCallback(
		async (data: string): Promise<Result<ImportedPubky>> => {
			const currentPubkys = getPubkyKeys(getStore());
			if (!data.trim()) {
				return err(t('import.notValidSecretKey'));
			}

			const res = await isSecretKeyImport(data);
			if (res.isErr()) {
				return err(res.error.message);
			}
			if (!res.value.isSecretKey) {
				return err(t('import.notValidSecretKey'));
			}

			let secretKey = '';
			let mnemonic = '';
			switch (res.value.backupPreference) {
				case EBackupPreference.encryptedFile:
					secretKey = data;
					break;
				case EBackupPreference.recoveryPhrase:
					mnemonic = data;
					break;
			}

			if (mnemonic) {
				const secretKeyRes: Result<IGenerateSecretKey> = await mnemonicPhraseToKeypair(mnemonic);
				if (secretKeyRes.isErr()) {
					const msg = secretKeyRes.error.message;
					showToast({
						type: 'error',
						title: t('common.error'),
						description: msg,
					});
					return err(msg);
				}
				secretKey = secretKeyRes.value.secret_key;
			}

			const pubky = await importPubkyUtil({
				secretKey,
				dispatch,
				mnemonic,
			});
			if (pubky.isErr()) {
				const msg = pubky.error.message;
				showToast({
					type: 'error',
					title: t('common.error'),
					description: msg,
				});
				return err(msg);
			}
			const isNewPubky = !currentPubkys.includes(pubky.value);
			return ok({ pubky: pubky.value, isNewPubky });
		},
		[dispatch, t],
	);

	const confirmPubkyBackup = useCallback(
		(pubky: string, backupPreference: EBackupPreference) => {
			dispatch(
				setPubkyData({
					pubky,
					data: {
						backupPreference,
						isBackedUp: true,
					},
				}),
			);
		},
		[dispatch],
	);

	return { importPubky, confirmPubkyBackup };
};
