import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { SheetManager } from 'react-native-actions-sheet';
import { Result } from '@synonymdev/result';
import { mnemonicPhraseToKeypair, IGenerateSecretKey } from '@synonymdev/react-native-pubky';
import {
	getAllPubkys,
	getDeepLink,
	getSignedUpPubkys,
	getPubkyKeys,
} from '../store/selectors/pubkySelectors';
import { setDeepLink } from '../store/slices/pubkysSlice';
import { handleDeepLink, showToast, sleep, isSecretKeyImport } from '../utils/helpers';
import { importPubky as importPubkyUtil } from '../utils/pubky';
import { showImportSuccessSheet, showEditPubkySheet } from '../utils/sheetHelpers';
import { getStore } from '../utils/store-helpers';
import { EBackupPreference } from '../types/pubky.ts';

const handleSignedUpPubkys = async (
	signedUpPubkysLength: number,
	signedUpPubkys: Record<string, any>,
	deepLink: string,
	dispatch: Dispatch,
): Promise<void> => {
	SheetManager.hideAll();
	await sleep(150);

	if (signedUpPubkysLength > 1) {
		SheetManager.show('select-pubky', {
			payload: { deepLink },
			onClose: (): void => {
				SheetManager.hide('select-pubky');
			},
		});
	} else {
		const pubky = Object.keys(signedUpPubkys)[0];
		setTimeout((): void => {
			handleDeepLink({
				pubky,
				url: deepLink,
				dispatch,
			});
		}, 100);
	}
};

const handleNoSignedUpPubkys = async (
	pubkys: Record<string, any>,
	dispatch: Dispatch,
	createPubky: () => Promise<void>,
	importPubky: (mnemonic?: string) => Promise<any>,
): Promise<void> => {
	dispatch(setDeepLink(''));

	if (Object.keys(pubkys).length) {
		showToast({
			type: 'info',
			title: 'No Pubkys are setup',
			description: 'Please setup any of your existing Pubkys to proceed.',
			visibilityTime: 5000,
		});
	} else {
		showToast({
			type: 'info',
			title: 'No Pubkys exist',
			description: 'Please add and setup a Pubky to proceed.',
			visibilityTime: 5000,
			onPress: (): void => {
				SheetManager.show('add-pubky', {
					payload: {
						createPubky,
						importPubky,
					},
					onClose: (): void => {
						SheetManager.hide('add-pubky');
					},
				});
			},
		});
	}
};

export const useDeepLinkHandler = (
	createPubky: () => Promise<void>,
	importPubky: (mnemonic?: string) => Promise<any>,
): { deepLink: string; handleDeepLink: () => Promise<void> } => {
	const dispatch = useDispatch();
	const deepLink = useSelector(getDeepLink);
	const signedUpPubkys = useSelector(getSignedUpPubkys);
	const pubkys = useSelector(getAllPubkys);

	const handleDeepLinkCallback = useCallback(async (): Promise<void> => {
		if (!deepLink) return;

		const isRecoveryRes = await isSecretKeyImport(deepLink);

		// Check if deepLink is a recovery phrase
		if (isRecoveryRes.isOk() && isRecoveryRes.value.isSecretKey) {
			// Clear the deeplink from store
			dispatch(setDeepLink(''));

			// Get current pubkys before import to check if this is new
			const currentPubkys = getPubkyKeys(getStore());

			// Normalize the recovery phrase (decode URL encoding and replace delimiters with spaces)
			let normalizedPhrase = deepLink;
			try {
				normalizedPhrase = decodeURIComponent(deepLink);
			} catch {
				// If decoding fails, use original
			}
			// Replace any delimiter (dash, underscore, plus) with space
			normalizedPhrase = normalizedPhrase.trim().replace(/[\-_+]+/g, ' ').toLowerCase();

			let secretKey = normalizedPhrase;
			if (isRecoveryRes.value.backupPreference === EBackupPreference.recoveryPhrase) {
				// Convert mnemonic to secret key
				const secretKeyRes: Result<IGenerateSecretKey> =
          await mnemonicPhraseToKeypair(normalizedPhrase);
				if (secretKeyRes.isErr()) {
					showToast({
						type: 'error',
						title: 'Import Failed',
						description: 'Invalid recovery phrase',
					});
					return;
				}
				secretKey = secretKeyRes.value.secret_key;
			}

			// Import the pubky using the same util as normal import
			const pubkyResult = await importPubkyUtil({
				secretKey,
				dispatch,
				mnemonic: isRecoveryRes.value.backupPreference === EBackupPreference.recoveryPhrase ? normalizedPhrase : '',
			});

			if (pubkyResult.isErr()) {
				showToast({
					type: 'error',
					title: 'Import Failed',
					description: pubkyResult.error.message,
				});
				return;
			}

			// Check if this is a new pubky
			const isNewPubky = !currentPubkys.includes(pubkyResult.value);

			// Show the import success sheet exactly like the normal flow
			setTimeout(() => {
				showImportSuccessSheet({
					pubky: pubkyResult.value,
					isNewPubky,
					onContinue: () => {
						setTimeout(() => {
							showEditPubkySheet({
								title: 'Setup',
								pubky: pubkyResult.value,
							});
						}, 150);
					},
				});
			}, 150);

			return;
		}

		const signedUpPubkysLength = Object.keys(signedUpPubkys).length;

		if (signedUpPubkysLength) {
			await handleSignedUpPubkys(
				signedUpPubkysLength,
				signedUpPubkys,
				deepLink,
				dispatch,
			);
		} else {
			await handleNoSignedUpPubkys(pubkys, dispatch, createPubky, importPubky);
		}
	}, [deepLink, dispatch, pubkys, signedUpPubkys, createPubky, importPubky]);

	useEffect((): void => {
		handleDeepLinkCallback();
	}, [handleDeepLinkCallback]);

	return { deepLink, handleDeepLink: handleDeepLinkCallback };
};
