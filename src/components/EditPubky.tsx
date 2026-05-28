import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { StyleSheet, Keyboard, TextInput as NativeTextInput, View } from 'react-native';
import { TextInput } from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { getPubkySecretKey, signInToHomeserver, signUpToHomeserver, truncatePubky } from '../utils/pubky.ts';
import { formatSignupToken } from '../utils/helpers.ts';
import { useDispatch, useSelector } from 'react-redux';
import { setPubkyData } from '../store/slices/pubkysSlice.ts';
import { SheetManager, ScrollView as ActionSheetScrollView } from 'react-native-actions-sheet';
import { err } from '@synonymdev/result';
import { DEFAULT_HOMESERVER, STAGING_HOMESERVER } from '../utils/constants.ts';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import i18n from '../i18n';
import { BodySText, CaptionText } from '../theme/typography';
import Sheet from './Sheet.tsx';

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

const EditPubky = ({
	payload,
}: {
	payload: {
		title?: string;
		description?: string;
		pubky: string;
	};
}): ReactElement => {
	const { pubky } = useMemo(() => payload, [payload]);
	const storedPubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const [loading, setLoading] = useState(false);
	const [newPubkyName, setNewPubkyName] = useState(storedPubkyData?.name || '');
	const [homeServer, setHomeServer] = useState(storedPubkyData?.homeserver || DEFAULT_HOMESERVER || '');
	const [signupToken, setSignupToken] = useState('');
	const pubkyNameLength = useMemo(() => newPubkyName.length, [newPubkyName.length]);
	const [nameError, setNameError] = useState<string>(
		pubkyNameLength > 20 ? `${MAX_NAME_LENGTH - pubkyNameLength} / ${MAX_NAME_LENGTH}` : '',
	);
	const dispatch = useDispatch();
	const [error, setError] = useState('');
	const signupTokenInputRef = useRef<NativeTextInput>(null);

	const isSignupTokenInputVisible = useMemo(() => {
		return storedPubkyData?.signedUp === false || storedPubkyData.homeserver !== (homeServer?.trim() || '');
	}, [storedPubkyData?.signedUp, storedPubkyData.homeserver, homeServer]);

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
		if (storedPubkyData.name !== newPubkyName.trim()) {
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
	}, [dispatch, newPubkyName, pubky, storedPubkyData]);

	const onClose = useCallback(() => {
		SheetManager.hide('edit-pubky');
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
				signupToken: storedPubkyData?.signupToken ?? '',
			};

			if (
				!storedPubkyData?.signedUp ||
				storedPubkyData.homeserver !== homeServer.trim() ||
				storedPubkyData?.signupToken !== signupToken
			) {
				let signedIn = false;
				if (!storedPubkyData?.signedUp || storedPubkyData.homeserver !== homeServer.trim()) {
					//Attempt sign-up
					const signupRes = await signUpToHomeserver({
						pubky,
						homeserver: homeServer.trim(),
						signupToken,
						secretKey,
						dispatch,
					});
					if (signupRes.isErr()) {
						// The pubky might be an import that can successfully login.
						if (!storedPubkyData.homeserver || storedPubkyData.homeserver === homeServer.trim()) {
							// Attempt sign-in
							const signinRes = await signInToHomeserver({
								pubky,
								homeserver: homeServer.trim(),
								secretKey,
								dispatch,
							});
							if (signinRes.isErr()) {
								updateName(); // No need to prevent updating the name if we can.
								setError(i18n.t('editPubkySheet.unableToSignUp'));
								return;
							}
							signedIn = true;
						} else {
							updateName(); // No need to prevent updating the name if we can.
							setError(i18n.t('editPubkySheet.unableToSignUp'));
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
						setError(i18n.t('editPubkySheet.unableToSignIn', { error: signinRes.error.message }));
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
		storedPubkyData?.signupToken,
		storedPubkyData?.signedUp,
		storedPubkyData.homeserver,
		signupToken,
		dispatch,
		updateName,
		onClose,
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
			newPubkyName.trim() !== storedPubkyData?.name ||
			homeServer.trim() !== storedPubkyData?.homeserver ||
			(signupToken.trim() !== storedPubkyData?.signupToken && signupToken.trim() !== '')
		);
	}, [
		newPubkyName,
		homeServer,
		signupToken,
		storedPubkyData?.name,
		storedPubkyData?.homeserver,
		storedPubkyData?.signupToken,
	]);

	const handleNameSubmit = useCallback(() => {
		if (storedPubkyData?.signedUp) {
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
	}, [
		storedPubkyData?.signedUp,
		isSignupTokenInputVisible,
		handleSubmit,
		haveFieldsChanged,
		clearErrorState,
	]);

	const handleHomeserverSubmit = useCallback(() => {
		if (homeServer.trim() !== storedPubkyData?.homeserver && !signupToken) {
			signupTokenInputRef.current?.focus();
		} else if (haveFieldsChanged) {
			handleSubmit();
		} else if (storedPubkyData?.signedUp) {
			// If signed up but no fields changed, clear error
			clearErrorState();
		}
	}, [
		homeServer,
		storedPubkyData?.homeserver,
		storedPubkyData?.signedUp,
		signupToken,
		haveFieldsChanged,
		handleSubmit,
		clearErrorState,
	]);

	const isSignupTokenEditable = useMemo(() => {
		// Not editable when loading or when already signed up with the same homeserver
		return !(loading || (storedPubkyData?.signedUp && storedPubkyData.homeserver === homeServer.trim()));
	}, [loading, homeServer, storedPubkyData.homeserver, storedPubkyData?.signedUp]);

	const title = useMemo(() => {
		return [payload?.title, truncatePubky(pubky)].filter(Boolean).join(' ');
	}, [payload?.title, pubky]);

	const onReset = useCallback(() => {
		try {
			setError('');
			setHomeServer(storedPubkyData?.homeserver ?? '');
			setNewPubkyName(storedPubkyData?.name ?? '');
			setSignupToken('');
		} catch (e) {
			console.log('Reset error:', e);
		}
	}, [storedPubkyData]);

	// Clear error state when save button becomes disabled (fields revert to original values)
	useEffect(() => {
		if (storedPubkyData?.signedUp && !haveFieldsChanged && error) {
			onReset();
		}
	}, [storedPubkyData?.signedUp, haveFieldsChanged, error, onReset]);

	const handleSignupTokenChange = useCallback(
		(text: string) => {
			const formatted = formatSignupTokenForHomeserver(text);
			setSignupToken(formatted);
		},
		[formatSignupTokenForHomeserver],
	);

	const leftButtonText = useMemo(() => {
		if (storedPubkyData.homeserver && haveFieldsChanged) {
			return loading ? i18n.t('common.close') : i18n.t('editPubkySheet.reset');
		}
		return i18n.t('common.close');
	}, [storedPubkyData.homeserver, haveFieldsChanged, loading]);

	const leftButtonOnPress = useCallback(() => {
		if (storedPubkyData.homeserver && haveFieldsChanged) {
			return loading ? onClose() : onReset();
		}
		return onClose();
	}, [storedPubkyData.homeserver, haveFieldsChanged, loading, onClose, onReset]);

	return (
		<Sheet id="edit-pubky" title={title} keyboardHandlerEnabled={false}>
			<ActionSheetScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
				<CaptionText testID="edit-pubky-label">{i18n.t('editPubkySheet.pubkyNameLabel')}</CaptionText>
				<InputItemComponent
					testID="EditPubkyNameInput"
					value={newPubkyName}
					onChangeText={handleChangeText}
					placeholder={i18n.t('editPubkySheet.pubkyNamePlaceholder')}
					error={nameError}
					autoFocus={true}
					onSubmitEditing={handleNameSubmit}
				/>

				{isSignupTokenInputVisible && (
					<>
						<CaptionText>
							{i18n.t('editPubkySheet.inviteCodeOptional')}
						</CaptionText>
						<InputItemComponent
							testID="EditPubkyInviteCodeInput"
							inputRef={signupTokenInputRef}
							value={signupToken}
							onChangeText={handleSignupTokenChange}
							placeholder={i18n.t('editPubkySheet.inviteCodePlaceholder')}
							error=""
							autoFocus={false}
							onSubmitEditing={() => {
								if (haveFieldsChanged || !storedPubkyData?.signedUp) {
									handleSubmit();
								} else if (storedPubkyData?.signedUp) {
									clearErrorState();
								}
							}}
							editable={isSignupTokenEditable}
						/>
					</>
				)}

				<CaptionText>{i18n.t('editPubky.homeserver')}</CaptionText>
				<InputItemComponent
					testID="EditPubkyHomeserverInput"
					value={homeServer}
					onChangeText={setHomeServer}
					placeholder={i18n.t('editPubky.homeserver')}
					error=""
					autoFocus={false}
					onSubmitEditing={handleHomeserverSubmit}
				/>

				<View style={styles.footerContainer}>
					{error ? (
						<BodySText colorName="danger" style={styles.errorText}>
							{error}
						</BodySText>
					) : null}
				</View>
			</ActionSheetScrollView>

			<View style={styles.buttonContainer}>
				<Button text={leftButtonText} size="large" testID="EditPubkyLeftButton" onPress={leftButtonOnPress} />
				<Button
					text={i18n.t('common.save')}
					size="large"
					variant="secondary"
					loading={loading}
					disabled={storedPubkyData?.signedUp && !haveFieldsChanged}
					testID="EditPubkySaveButton"
					onPress={handleSubmit}
				/>
			</View>
		</Sheet>
	);
};

const styles = StyleSheet.create({
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

export default memo(EditPubky);
