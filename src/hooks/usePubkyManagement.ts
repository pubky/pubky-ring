import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { SheetManager } from 'react-native-actions-sheet';
import { Result, err, ok } from '@synonymdev/result';
import { mnemonicPhraseToKeypair, IGenerateSecretKey } from '@synonymdev/react-native-pubky';
import {
	createNewPubky,
	importPubky as importPubkyUtil,
} from '../utils/pubky';
import { showToast } from '../utils/helpers';
import { importFile } from '../utils/rnfs';
import { showEditPubkySheet,
	showImportSuccessSheet,
	showNewPubkySetupSheet
} from "../utils/sheetHelpers.ts";
import { setPubkyData } from '../store/slices/pubkysSlice';
import { EBackupPreference } from '../types/pubky';
import { getStore } from "../utils/store-helpers.ts";
import { getPubkyKeys } from '../store/selectors/pubkySelectors';
import { copyToClipboard } from "../utils/clipboard.ts";

export const usePubkyManagement = (): {
	createPubky: () => Promise<void>;
	importPubky: (mnemonic?: string) => Promise<Result<string>>;
	confirmPubkyBackup: (pubky: string, backupPreference: EBackupPreference) => void;
} => {
	const dispatch = useDispatch();

	const createPubky = useCallback(async () => {
		const pubky = await createNewPubky(dispatch);
		if (pubky.isErr()) {
			showToast({
				type: 'error',
				title: 'Error',
				description: 'An error occurred while creating the Pubky',
			});
			return;
		}
		setTimeout(() => {
			showNewPubkySetupSheet({
				pubky: pubky.value,
			});
		}, 200);
	}, [dispatch]);

	const importPubky = useCallback(
		async (mnemonic = ''): Promise<Result<string>> => {
			const currentPubkys = getPubkyKeys(getStore());
			if (mnemonic) {
				const secretKeyRes: Result<IGenerateSecretKey> =
					await mnemonicPhraseToKeypair(mnemonic);
				if (secretKeyRes.isErr()) {
					const msg = secretKeyRes.error.message;
					showToast({
						type: 'error',
						title: 'Error',
						description: msg,
					});
					return err(msg);
				}

				const secretKey: string = secretKeyRes.value.secret_key;
				const pubky = await importPubkyUtil({ secretKey, dispatch, mnemonic });
				if (pubky.isErr()) {
					const msg = pubky.error.message;
					showToast({
						type: 'error',
						title: 'Error',
						description: msg,
					});
					return err(msg);
				}
				const isNewPubky = !currentPubkys.includes(pubky.value);
				await SheetManager.hide('add-pubky');
				setTimeout(() => {
					showImportSuccessSheet({
						pubky: pubky.value,
						isNewPubky,
						onContinue: () => {
							setTimeout(() => {
								showEditPubkySheet({
									title: 'Setup',
									pubky: pubky.value,
								});
							}, 200);
						}
					});
				}, 200);
				return ok('Successfully created pubky.');
			}

			const res = await importFile(dispatch);
			if (res.isErr()) {
				const msg = res.error?.message ?? 'Unable to import file.';
				if (res.error?.message && res.error.message !== 'OPERATION_CANCELLED') {
					showToast({
						type: 'error',
						title: 'Error',
						description: msg,
						onPress: () => {
							copyToClipboard(msg);
							// eslint-disable-next-line no-alert
							alert('Error message copied to clipboard');
						},
						visibilityTime: 10000,
					});
				}
				return err(msg);
			}

			const isNewPubky = !currentPubkys.includes(res.value);
			setTimeout(() => {
				showImportSuccessSheet({
					pubky: res.value,
					isNewPubky,
					onContinue: () => {
						setTimeout(() => {
							showEditPubkySheet({
								title: 'Setup',
								pubky: res.value,
							});
						}, 200);
					}
				});
			}, 200);

			const msg = 'Pubky imported successfully';
			return ok(msg);
		},
		[dispatch],
	);

	const confirmPubkyBackup = useCallback(
		(pubky: string, backupPreference: EBackupPreference) => {
			dispatch(setPubkyData({
				pubky,
				data: {
					backupPreference,
					isBackedUp: true,
				},
			}));
		},
		[dispatch],
	);

	return { createPubky, importPubky, confirmPubkyBackup };
};
