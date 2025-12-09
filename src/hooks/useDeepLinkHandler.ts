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
	getPubky,
} from '../store/selectors/pubkySelectors';
import { setDeepLink, addProcessing, removeProcessing } from '../store/slices/pubkysSlice';
import { handleDeepLink, showToast, sleep, isSecretKeyImport, EDeepLinkType, SignupDeepLinkParams, handleAuth } from '../utils/helpers';
import { importPubky as importPubkyUtil, createPubkyWithInviteCode, signUpToHomeserver, savePubky } from '../utils/pubky';
import { generateMnemonicPhraseAndKeypair } from '@synonymdev/react-native-pubky';
import { showImportSuccessSheet, showEditPubkySheet } from '../utils/sheetHelpers';
import { getStore } from '../utils/store-helpers';
import { EBackupPreference } from '../types/pubky.ts';
import { ECurrentScreen } from '../components/PubkySetup/NewPubkySetup';

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

		// Parse the deep link to determine its type
		let parsedDeepLink;
		try {
			parsedDeepLink = JSON.parse(deepLink);
		} catch {
			// For backward compatibility, treat as raw string
			parsedDeepLink = { type: EDeepLinkType.unknown, data: deepLink };
		}

		// Handle invite codes
		if (parsedDeepLink.type === EDeepLinkType.invite) {
			dispatch(setDeepLink(''));
			try {
				// Create pubky and sign up with invite code automatically
				const createRes = await createPubkyWithInviteCode(parsedDeepLink.data, dispatch);

				if (createRes.isErr()) {
					showToast({
						type: 'error',
						title: 'Signup Failed',
						description: createRes.error.message,
					});
					return;
				}

				const { pubky } = createRes.value;

				// Get the pubky data from store
				const pubkyData = getPubky(getStore(), pubky);

				// Show new pubky setup sheet on welcome screen with completed setup
				setTimeout(() => {
					SheetManager.show('new-pubky-setup', {
						payload: {
							pubky,
							data: pubkyData,
							currentScreen: ECurrentScreen.welcome,
							isInvite: true
						},
						onClose: () => {
							SheetManager.hide('new-pubky-setup');
						},
					});
				}, 150);
			} catch (error) {
				console.error('Error handling invite code:', error);
				showToast({
					type: 'error',
					title: 'Error',
					description: 'Failed to process invite code',
				});
			}
			return;
		}

		// Handle signup deep links
		// Format: pubkyauth://signup?hs={hs_pubky}&ic={invite_code}&relay={http_relay_url_with_channel_id}&secret={secret_base64}&caps={comma_separated_capabilities}
		if (parsedDeepLink.type === EDeepLinkType.signup) {
			dispatch(setDeepLink(''));
			let pubky = '';
			try {
				const signupParams: SignupDeepLinkParams = JSON.parse(parsedDeepLink.data);
				const { homeserver, inviteCode, relay, secret, caps } = signupParams;

				// Step 1: Generate a new keypair
				const genKeyRes = await generateMnemonicPhraseAndKeypair();
				if (genKeyRes.isErr()) {
					showToast({
						type: 'error',
						title: 'Signup Failed',
						description: 'Failed to generate keypair',
					});
					return;
				}

				const { mnemonic, secret_key: secretKey, public_key: generatedPubky } = genKeyRes.value;
				pubky = generatedPubky;

				// Set processing state
				dispatch(addProcessing({ pubky }));

				// Step 2: Save the pubky to keychain and Redux
				const saveRes = await savePubky({
					mnemonic,
					secretKey,
					pubky,
					dispatch,
					backupPreference: EBackupPreference.unknown,
					isBackedUp: false,
				});

				if (saveRes.isErr()) {
					showToast({
						type: 'error',
						title: 'Signup Failed',
						description: 'Failed to save pubky',
					});
					return;
				}

				// Step 3: Sign up to the specified homeserver with invite code
				const signupRes = await signUpToHomeserver({
					pubky,
					secretKey,
					homeserver,
					signupToken: inviteCode,
					dispatch,
				});

				if (signupRes.isErr()) {
					showToast({
						type: 'error',
						title: 'Signup Failed',
						description: signupRes.error.message,
					});
					return;
				}

				// Step 4: Construct the pubkyauth URL and show the auth modal
				// The auth URL format: pubkyauth:///?relay={relay}&secret={secret}&caps={caps}
				const capsString = caps.join(',');
				const authUrl = `pubkyauth:///?relay=${encodeURIComponent(relay)}&secret=${encodeURIComponent(secret)}&caps=${encodeURIComponent(capsString)}`;

				showToast({
					type: 'success',
					title: 'Signup Successful',
					description: 'Your new Pubky has been created',
				});

				// Step 5: Show the auth modal
				setTimeout(() => {
					handleAuth({
						pubky,
						authUrl,
						deepLink: false,
						retryAttempts: 5,
					});
				}, 150);
			} catch (error) {
				console.error('Error handling signup deep link:', error);
				showToast({
					type: 'error',
					title: 'Error',
					description: 'Failed to process signup',
				});
			} finally {
				// Clear processing state
				if (pubky) {
					dispatch(removeProcessing({ pubky }));
				}
			}
			return;
		}

		// Handle import (recovery phrases and secret keys)
		if (parsedDeepLink.type === EDeepLinkType.import) {
			const isRecoveryRes = await isSecretKeyImport(parsedDeepLink.data);
			if (isRecoveryRes.isOk() && isRecoveryRes.value.isSecretKey) {
				dispatch(setDeepLink(''));
				// Continue with existing import logic...
				const currentPubkys = getPubkyKeys(getStore());
				let normalizedPhrase = parsedDeepLink.data;
				try {
					normalizedPhrase = decodeURIComponent(parsedDeepLink.data);
				} catch {
					// If decoding fails, use original
				}
				normalizedPhrase = normalizedPhrase.trim().replace(/[\-_+]+/g, ' ').toLowerCase();

				let secretKey = normalizedPhrase;
				if (isRecoveryRes.value.backupPreference === EBackupPreference.recoveryPhrase) {
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

				const isNewPubky = !currentPubkys.includes(pubkyResult.value);
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
		}

		// Handle auth and unknown types (existing flow)
		const actualDeepLink = parsedDeepLink.type === EDeepLinkType.auth ? parsedDeepLink.data : deepLink;

		// Check if it's a recovery phrase for backward compatibility
		const isRecoveryRes = await isSecretKeyImport(actualDeepLink);
		if (isRecoveryRes.isOk() && isRecoveryRes.value.isSecretKey) {
			// Clear the deeplink from store
			dispatch(setDeepLink(''));
			const currentPubkys = getPubkyKeys(getStore());
			let normalizedPhrase = actualDeepLink;
			try {
				normalizedPhrase = decodeURIComponent(actualDeepLink);
			} catch {
				// If decoding fails, use original
			}
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

		// Handle auth URLs and other types
		const signedUpPubkysLength = Object.keys(signedUpPubkys).length;

		if (signedUpPubkysLength) {
			await handleSignedUpPubkys(
				signedUpPubkysLength,
				signedUpPubkys,
				actualDeepLink,
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
