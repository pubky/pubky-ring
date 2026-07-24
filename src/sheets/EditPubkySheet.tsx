import React, { memo, ReactElement, useCallback, useMemo, useState, useRef } from 'react';
import { StyleSheet, Keyboard, TextInput as NativeTextInput, View, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { TextInput } from '../theme/components.ts';
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
import { BodySText, CaptionText } from '../theme/typography';
import Sheet from '../components/Sheet.tsx';
import { getSignupTokenErrorDescription } from '../utils/signupErrors.ts';
import type { RootStackParamList } from '../navigation/types.ts';

const MAX_NAME_LENGTH = 50;

const InputItemComponent = ({
	testID,
	value,
	onChangeText,
	placeholder,
	error,
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
	autoFocus?: boolean;
	onSubmitEditing?: () => void;
	editable?: boolean;
	style?: any;
	inputRef?: React.RefObject<NativeTextInput | null>;
}): ReactElement => {
	return (
		<View style={[styles.inputWrapper, style]}>
			<View style={[styles.inputContainer, error ? styles.inputError : null]}>
				<TextInput
					style={styles.input}
					testID={testID}
					ref={inputRef}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor="rgba(255, 255, 255, 0.32)"
					autoFocus={autoFocus}
					onSubmitEditing={onSubmitEditing}
					autoCapitalize="none"
					editable={editable}
				/>
			</View>
			{error ? (
				<BodySText colorName="danger" style={styles.errorText}>
					{error}
				</BodySText>
			) : null}
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
	const signupTokenInputRef = useRef<NativeTextInput>(null);

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
				<CaptionText testID="EditPubkyNameLabel">{t('editPubkySheet.pubkyNameLabel')}</CaptionText>
				<InputItemComponent
					testID="EditPubkyNameInput"
					value={newPubkyName}
					onChangeText={handleChangeText}
					placeholder={t('editPubkySheet.pubkyNamePlaceholder')}
					error={nameError}
					autoFocus={true}
					onSubmitEditing={handleNameSubmit}
				/>

				{isSignupTokenInputVisible && (
					<>
						<CaptionText>{t('editPubkySheet.inviteCodeOptional')}</CaptionText>
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

				<CaptionText testID="EditPubkyHomeserverLabel">{t('editPubky.homeserver')}</CaptionText>
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
						<BodySText colorName="danger" style={styles.errorText}>
							{displayedError}
						</BodySText>
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
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.32)',
		borderRadius: 16,
		borderStyle: 'dashed',
		height: 70,
	},
	input: {
		flex: 1,
	},
	inputError: {
		borderColor: '#FF0000',
	},
	errorText: {
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
		gap: 16,
		marginTop: 'auto',
	},
});

export default memo(EditPubkySheet);
