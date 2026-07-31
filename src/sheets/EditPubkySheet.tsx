import React, { memo, ReactElement, useCallback, useMemo, useState, useRef } from 'react';
import { Keyboard, ScrollView, StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button.tsx';
import { getPubkySecretKey, signInToHomeserver, signUpToHomeserver, truncatePubky } from '../utils/pubky.ts';
import { formatSignupToken } from '../utils/helpers.ts';
import { useDispatch, useSelector } from 'react-redux';
import { setPubkyData } from '../store/slices/pubkysSlice.ts';
import { hideSheet } from './sheetNavigation.tsx';
import { err } from '@synonymdev/result';
import { DEFAULT_HOMESERVER, STAGING_HOMESERVER } from '../utils/constants.ts';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { TextSmM, TextXsM } from '../theme/typography';
import Sheet from '../components/Sheet.tsx';
import { getSignupTokenErrorDescription } from '../utils/signupErrors.ts';
import type { RootStackParamList } from '../navigation/types.ts';
import TextField from '../components/TextField.tsx';

const MAX_NAME_LENGTH = 50;

const InputItemComponent = ({
	testID,
	value,
	onChangeText,
	placeholder,
	error,
	helperText,
	autoFocus = false,
	onSubmitEditing,
	editable = true,
	style,
	inputRef,
}: {
	testID?: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder: string;
	error?: string;
	helperText?: string;
	autoFocus?: boolean;
	onSubmitEditing?: () => void;
	editable?: boolean;
	style?: StyleProp<ViewStyle>;
	inputRef?: React.RefObject<TextInput | null>;
}): ReactElement => {
	return (
		<View style={[styles.inputWrapper, style]}>
			<TextField
				testID={testID}
				ref={inputRef}
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				autoFocus={autoFocus}
				onSubmitEditing={onSubmitEditing}
				autoCapitalize="none"
				editable={editable}
				error={error}
				errorStyle={styles.errorText}
				helperText={helperText}
				helperTextStyle={styles.helperText}
			/>
		</View>
	);
};

const EditPubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'EditPubkySheet'>): ReactElement => {
	const { t } = useTranslation();
	const { pubky } = route.params;
	const storedPubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const storedName = storedPubkyData?.name ?? '';
	const storedHomeserver = storedPubkyData?.homeserver ?? '';
	const storedSignupToken = storedPubkyData?.signupToken ?? '';
	const isStoredUnsigned = storedPubkyData?.signedUp === false;
	const isStoredSignedUp = storedPubkyData?.signedUp === true;
	const [loading, setLoading] = useState(false);
	const [newPubkyName, setNewPubkyName] = useState(storedName);
	const [homeServer, setHomeServer] = useState(storedHomeserver || DEFAULT_HOMESERVER || '');
	const [signupToken, setSignupToken] = useState('');
	const pubkyNameLength = newPubkyName.length;
	const [nameError, setNameError] = useState<string>(
		pubkyNameLength > 20 ? `${MAX_NAME_LENGTH - pubkyNameLength} / ${MAX_NAME_LENGTH}` : '',
	);
	const dispatch = useDispatch();
	const [error, setError] = useState('');
	const signupTokenInputRef = useRef<TextInput>(null);

	const isSignupTokenInputVisible = useMemo(() => {
		return isStoredUnsigned || storedHomeserver !== (homeServer?.trim() || '');
	}, [homeServer, isStoredUnsigned, storedHomeserver]);

	const formatSignupTokenForHomeserver = useCallback(
		(text: string) => {
			// Only format if using the default or staging homeserver
			if (homeServer.trim() !== DEFAULT_HOMESERVER && homeServer.trim() !== STAGING_HOMESERVER) {
				return text;
			}

			return formatSignupToken(text);
		},
		[homeServer],
	);

	const clearErrorState = useCallback(() => {
		if (error) {
			setError('');
		}
	}, [error]);

	const updateName = useCallback(() => {
		if (storedName !== newPubkyName.trim()) {
			dispatch(
				setPubkyData({
					pubky,
					data: {
						...storedPubkyData,
						name: newPubkyName,
					},
				}),
			);
		}
	}, [dispatch, newPubkyName, pubky, storedName, storedPubkyData]);

	const onClose = useCallback(() => {
		hideSheet('edit-pubky');
	}, []);

	const handleSubmit = useCallback(async () => {
		try {
			Keyboard.dismiss();
			setLoading(true);

			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				updateName(); // No need to prevent updating the name if we can.
				return err(secretKeyRes.error.message);
			}
			const secretKey = secretKeyRes.value.secretKey;

			let newData = {
				name: newPubkyName.trim(),
				homeserver: homeServer.trim(),
				signupToken: storedSignupToken,
			};

			if (!isStoredSignedUp || storedHomeserver !== homeServer.trim() || storedSignupToken !== signupToken) {
				let signedIn = false;
				if (!isStoredSignedUp || storedHomeserver !== homeServer.trim()) {
					//Attempt sign-up
					const signupRes = await signUpToHomeserver({
						pubky,
						homeserver: homeServer.trim(),
						signupToken,
						secretKey,
						dispatch,
					});
					if (signupRes.isErr()) {
						const signupErrorMessage =
							getSignupTokenErrorDescription(signupRes.error.message) ?? t('editPubkySheet.unableToSignUp');

						// The pubky might be an import that can successfully login.
						if (!storedHomeserver || storedHomeserver === homeServer.trim()) {
							// Attempt sign-in
							const signinRes = await signInToHomeserver({
								pubky,
								homeserver: homeServer.trim(),
								secretKey,
								dispatch,
							});
							if (signinRes.isErr()) {
								updateName(); // No need to prevent updating the name if we can.
								setError(signupErrorMessage);
								return;
							}
							signedIn = true;
						} else {
							updateName(); // No need to prevent updating the name if we can.
							setError(signupErrorMessage);
							return;
						}
					}
					newData = {
						...newData,
						signupToken,
					};
				}
				if (!signedIn) {
					// Attempt sign-in
					const signinRes = await signInToHomeserver({
						pubky,
						homeserver: homeServer,
						secretKey,
						dispatch,
					});
					if (signinRes.isErr()) {
						updateName(); // No need to prevent updating the name if we can.
						setError(t('editPubkySheet.unableToSignIn', { error: signinRes.error.message }));
						return;
					}
				}
			}

			dispatch(
				setPubkyData({
					pubky,
					data: newData,
				}),
			);
			setError('');
			onClose();
		} finally {
			setLoading(false);
		}
	}, [
		pubky,
		newPubkyName,
		homeServer,
		storedSignupToken,
		isStoredSignedUp,
		storedHomeserver,
		signupToken,
		dispatch,
		updateName,
		onClose,
		t,
	]);

	const handleChangeText = useCallback((text: string) => {
		if (text.length > MAX_NAME_LENGTH) {
			return;
		}
		setNewPubkyName(text);
		if (text.length > 20) {
			setNameError(`${MAX_NAME_LENGTH - text.length} / ${MAX_NAME_LENGTH}`);
		} else {
			setNameError('');
		}
	}, []);

	const haveFieldsChanged = useMemo(() => {
		return (
			newPubkyName.trim() !== storedName ||
			homeServer.trim() !== storedHomeserver ||
			(signupToken.trim() !== storedSignupToken && signupToken.trim() !== '')
		);
	}, [newPubkyName, homeServer, signupToken, storedName, storedHomeserver, storedSignupToken]);

	const handleNameSubmit = useCallback(() => {
		if (isStoredSignedUp) {
			if (haveFieldsChanged) {
				// If already signed up and fields changed, run handleSubmit
				handleSubmit();
			} else {
				// If signed up but no fields changed, clear error
				clearErrorState();
			}
		} else if (isSignupTokenInputVisible && signupTokenInputRef.current) {
			// If not signed up and invite code input is visible, focus it
			signupTokenInputRef.current.focus();
		}
	}, [isSignupTokenInputVisible, handleSubmit, haveFieldsChanged, clearErrorState, isStoredSignedUp]);

	const handleHomeserverSubmit = useCallback(() => {
		if (homeServer.trim() !== storedHomeserver && !signupToken) {
			signupTokenInputRef.current?.focus();
		} else if (haveFieldsChanged) {
			handleSubmit();
		} else if (isStoredSignedUp) {
			// If signed up but no fields changed, clear error
			clearErrorState();
		}
	}, [
		homeServer,
		storedHomeserver,
		signupToken,
		haveFieldsChanged,
		handleSubmit,
		isStoredSignedUp,
		clearErrorState,
	]);

	const isSignupTokenEditable = useMemo(() => {
		// Not editable when loading or when already signed up with the same homeserver
		return !(loading || (isStoredSignedUp && storedHomeserver === homeServer.trim()));
	}, [loading, homeServer, storedHomeserver, isStoredSignedUp]);

	const titlePrefix = isStoredSignedUp ? t('common.edit') : t('pubky.setup');
	const title = [titlePrefix, truncatePubky(pubky)].join(' ');

	const onReset = useCallback(() => {
		try {
			setError('');
			setHomeServer(storedHomeserver);
			setNewPubkyName(storedName);
			setSignupToken('');
		} catch (e) {
			console.log('Reset error:', e);
		}
	}, [storedHomeserver, storedName]);

	const handleSignupTokenChange = useCallback(
		(text: string) => {
			const formatted = formatSignupTokenForHomeserver(text);
			setSignupToken(formatted);
		},
		[formatSignupTokenForHomeserver],
	);

	const leftButtonText = useMemo(() => {
		if (storedHomeserver && haveFieldsChanged) {
			return loading ? t('common.close') : t('editPubkySheet.reset');
		}
		return t('common.close');
	}, [storedHomeserver, haveFieldsChanged, loading, t]);

	const leftButtonOnPress = useCallback(() => {
		if (storedHomeserver && haveFieldsChanged) {
			return loading ? onClose() : onReset();
		}
		return onClose();
	}, [storedHomeserver, haveFieldsChanged, loading, onClose, onReset]);

	const displayedError = isStoredSignedUp && !haveFieldsChanged ? '' : error;

	return (
		<Sheet id="edit-pubky" title={title}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<TextXsM testID="EditPubkyNameLabel">{t('editPubkySheet.pubkyNameLabel')}</TextXsM>
				<InputItemComponent
					value={newPubkyName}
					placeholder={t('editPubkySheet.pubkyNamePlaceholder')}
					helperText={nameError}
					autoFocus={true}
					testID="EditPubkyNameInput"
					onChangeText={handleChangeText}
					onSubmitEditing={handleNameSubmit}
				/>

				{isSignupTokenInputVisible && (
					<>
						<TextXsM>{t('editPubkySheet.inviteCodeOptional')}</TextXsM>
						<InputItemComponent
							testID="EditPubkyInviteCodeInput"
							inputRef={signupTokenInputRef}
							value={signupToken}
							onChangeText={handleSignupTokenChange}
							placeholder={t('editPubkySheet.inviteCodePlaceholder')}
							error=""
							autoFocus={false}
							onSubmitEditing={() => {
								if (haveFieldsChanged || !isStoredSignedUp) {
									handleSubmit();
								} else if (isStoredSignedUp) {
									clearErrorState();
								}
							}}
							editable={isSignupTokenEditable}
						/>
					</>
				)}

				<TextXsM testID="EditPubkyHomeserverLabel">{t('editPubky.homeserver')}</TextXsM>
				<InputItemComponent
					testID="EditPubkyHomeserverInput"
					value={homeServer}
					onChangeText={setHomeServer}
					placeholder={t('editPubky.homeserver')}
					error=""
					autoFocus={false}
					onSubmitEditing={handleHomeserverSubmit}
				/>

				<View style={styles.footerContainer}>
					{displayedError ? (
						<TextSmM colorName="danger" style={styles.errorText}>
							{displayedError}
						</TextSmM>
					) : null}
				</View>
			</ScrollView>

			<View style={styles.buttonContainer}>
				<Button text={leftButtonText} size="large" testID="EditPubkyLeftButton" onPress={leftButtonOnPress} />
				<Button
					text={t('common.save')}
					size="large"
					variant="secondary"
					loading={loading}
					disabled={isStoredSignedUp && !haveFieldsChanged}
					testID="EditPubkySaveButton"
					onPress={handleSubmit}
				/>
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	inputWrapper: {
		marginTop: 8,
		marginBottom: 24,
	},
	errorText: {
		textAlign: 'center',
		marginTop: 4,
	},
	helperText: {
		textAlign: 'center',
		marginTop: 4,
	},
	footerContainer: {
		paddingBottom: 16,
		alignItems: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 'auto',
	},
});

export default memo(EditPubkySheet);
