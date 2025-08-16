import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Image, Platform, StyleSheet, KeyboardAvoidingView, Keyboard } from 'react-native';
import {
	ActionSheetContainer,
	Text,
	TextInput,
	View,
	SkiaGradient,
	AnimatedView,
	RadialGradient,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import {
	getPubkySecretKey,
	signInToHomeserver,
	signUpToHomeserver, truncatePubky,
} from '../utils/pubky.ts';
import { formatSignupToken } from '../utils/helpers.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { setPubkyData } from '../store/slices/pubkysSlice.ts';
import ModalIndicator from './ModalIndicator.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import { err } from '@synonymdev/result';
import {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import {
	DEFAULT_HOMESERVER,
	ONBOARDING_KEY_ERROR_RADIAL_GRADIENT,
	ONBOARDING_KEY_RADIAL_GRADIENT,
	STAGING_HOMESERVER,
} from '../utils/constants.ts';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { FlashList } from 'react-native-actions-sheet/dist/src/views/FlashList';

type InputDataItem = {
	id: 'name' | 'homeserver' | 'signuptoken';
	value: string;
	onChange: (text: string) => void;
	placeholder: string;
	error: string;
	autoFocus: boolean;
};

const MAX_NAME_LENGTH = 50;
const TITLE = '';

const ACTION_SHEET_HEIGHT = Platform.OS === 'ios' ? '95%' : '100%';

const InputItemComponent = ({
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
	value: string;
	onChangeText: (text: string) => void;
	placeholder: string;
	error?: string;
	autoFocus?: boolean;
	onSubmitEditing?: () => void;
	editable?: boolean;
	style?: any;
	inputRef?: React.RefObject<any>;
}): ReactElement => {
	return (
		<View style={[styles.inputWrapper, style]}>
			<View style={[styles.inputContainer, error ? styles.inputError : null]}>
				<TextInput
					// @ts-ignore
					ref={inputRef}
					style={styles.input}
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor="#999"
					autoFocus={autoFocus}
					onSubmitEditing={onSubmitEditing}
					autoCapitalize="none"
					editable={editable}
				/>
			</View>
			{error ? <Text style={styles.errorText}>{error}</Text> : null}
		</View>
	);
};

const textInputTitleText: {
	name: string;
	homeserver: string;
	signuptoken: string;
} = {
	name: 'Pubky name (label)',
	homeserver: 'Homeserver',
	signuptoken: 'Invite code (optional)',
};

const EditPubky = ({ payload }: {
	payload: {
		title?: string;
		description?: string;
		pubky: string;
	};
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
	const { pubky } = useMemo(() => payload, [payload]);
	const storedPubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const [loading, setLoading] = useState(false);
	const [newPubkyName, setNewPubkyName] = useState(storedPubkyData?.name || '');
	const [homeServer, setHomeServer] = useState(storedPubkyData?.homeserver || DEFAULT_HOMESERVER || '');
	const [signupToken, setSignupToken] = useState('');
	const pubkyNameLength = useMemo(() => newPubkyName.length, [newPubkyName.length]);
	const [nameError, setNameError] = useState<string>(pubkyNameLength > 20 ? `${MAX_NAME_LENGTH - pubkyNameLength} / ${MAX_NAME_LENGTH}` : '');
	const dispatch = useDispatch();
	const checkOpacity = useSharedValue(0);
	const checkScale = useSharedValue(0.2);
	const [error, setError] = useState('');
	const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
	const signupTokenInputRef = useRef<any>(null);

	const gradientOpacity = useSharedValue(0);

	const signupTokenOpacity = useSharedValue(
		storedPubkyData?.signedUp === false || storedPubkyData.homeserver !== (homeServer?.trim() || '') ? 1 : 0
	);

	const isSignupTokenInputVisible = useMemo(() => {
		return storedPubkyData?.signedUp === false || storedPubkyData.homeserver !== (homeServer?.trim() || '');
	}, [storedPubkyData?.signedUp, storedPubkyData.homeserver, homeServer]);


	// Whether signupToken TextInput should be visible
	useEffect(() => {
		signupTokenOpacity.value = withTiming(isSignupTokenInputVisible ? 1 : 0, { duration: 300 });
	}, [isSignupTokenInputVisible, signupTokenOpacity]);

	const formatSignupTokenForHomeserver = useCallback((text: string) => {
		// Only format if using the default or staging homeserver
		if (homeServer.trim() !== DEFAULT_HOMESERVER && homeServer.trim() !== STAGING_HOMESERVER) {
			return text;
		}

		return formatSignupToken(text);
	}, [homeServer]);

	const clearErrorState = useCallback(() => {
		if (error) {
			// Ensure any existing animations are cleared
			if (fadeOutTimerRef.current) {
				clearTimeout(fadeOutTimerRef.current);
				fadeOutTimerRef.current = null;
			}
			// If animations are visible, fade them out first
			if (checkOpacity.value > 0) {
				// Start fading out the error state
				checkOpacity.value = withTiming(0, { duration: 500 });
				gradientOpacity.value = withTiming(0, { duration: 500 });

				// Clear the error after the fade starts, giving time for smooth transition
				setTimeout(() => {
					setError('');
					checkScale.value = 0;
				}, 250);
			} else {
				// If no animations are visible, just clear the error
				setError('');
			}
		}
	}, [error, checkOpacity, gradientOpacity, checkScale]);

	const showCheckAnimation = useCallback(({ success }: { success: boolean }) => {
		// Clear any existing timers to prevent conflicting animations
		if (fadeOutTimerRef.current) {
			clearTimeout(fadeOutTimerRef.current);
			fadeOutTimerRef.current = null;
		}

		// If transitioning from visible error to success, fade out first
		if (checkOpacity.value > 0 && error && success) {
			// Fade out current state
			checkOpacity.value = withTiming(0, { duration: 300 });
			gradientOpacity.value = withTiming(0, { duration: 300 });

			// Then show new state after brief pause
			setTimeout(() => {
				checkOpacity.value = withTiming(1, { duration: 500 });
				gradientOpacity.value = withTiming(1, { duration: 500 });
				checkScale.value = withSpring(1, {
					damping: 10,
					stiffness: 100,
				});
			}, 350);
		} else {
			// Show animation immediately if not transitioning
			checkOpacity.value = withTiming(1, { duration: 500 });
			gradientOpacity.value = withTiming(1, { duration: 500 });
			checkScale.value = withSpring(1, {
				damping: 10,
				stiffness: 100,
			});
		}

		if (success) {
			// Set a new timer for fade out
			const delay = checkOpacity.value > 0 && error ? 2150 : 1800; // Add extra time if transitioning
			fadeOutTimerRef.current = setTimeout(() => {
				// Hide both check and gradient
				checkOpacity.value = withTiming(0, { duration: 3000 });
				gradientOpacity.value = withTiming(0, { duration: 3000 });

				// Store reference to reset the scale after opacity animation
				fadeOutTimerRef.current = setTimeout(() => {
					checkScale.value = 0;
					fadeOutTimerRef.current = null;
				}, 3005);
			}, delay);
		}
	}, [checkOpacity, checkScale, gradientOpacity, error]);

	const checkStyle = useAnimatedStyle(() => ({
		opacity: checkOpacity.value,
		transform: [{ scale: checkScale.value }],
	}));

	const gradientStyle = useAnimatedStyle(() => ({
		opacity: gradientOpacity.value,
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		pointerEvents: 'none',
	}));

	const updateName = useCallback(() => {
		if (storedPubkyData.name !== newPubkyName.trim()) {
			dispatch(setPubkyData({
				pubky,
				data: {
					...storedPubkyData,
					name: newPubkyName,
				},
			}));
		}
	}, [dispatch, newPubkyName, pubky, storedPubkyData]);

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

			if (!storedPubkyData?.signedUp || storedPubkyData.homeserver !== homeServer.trim() || storedPubkyData?.signupToken !== signupToken) {
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
								setError('Unable to sign up with the homeserver. Please update the homeserver and/or invite code and try again.');
								showCheckAnimation({ success: false });
								return;
							}
							signedIn = true;
						} else {
							updateName(); // No need to prevent updating the name if we can.
							setError('Unable to sign up with the homeserver. Please update the homeserver and/or invite code and try again.');
							showCheckAnimation({ success: false });
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
						setError(`Unable to sign in to homeserver: ${signinRes.error.message}`);
						showCheckAnimation({ success: false });
						return;
					}
				}
			}

			dispatch(setPubkyData({
				pubky,
				data: newData,
			}));
			setError('');
			showCheckAnimation({ success: true });
		} finally {
			setLoading(false);
		}
	}, [pubky, newPubkyName, homeServer, storedPubkyData?.signupToken, storedPubkyData?.signedUp, storedPubkyData.homeserver, signupToken, dispatch, showCheckAnimation, updateName]);

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
			(signupToken.trim() !== (storedPubkyData?.signupToken) &&
			signupToken.trim() !== '')
		);
	}, [newPubkyName, homeServer, signupToken, storedPubkyData?.name, storedPubkyData?.homeserver, storedPubkyData?.signupToken]);

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
	}, [storedPubkyData?.signedUp, isSignupTokenInputVisible, handleSubmit, haveFieldsChanged, clearErrorState]);

	const handleHomeserverSubmit = useCallback(() => {
		if (homeServer.trim() !== storedPubkyData?.homeserver && !signupToken) {
			signupTokenInputRef.current.focus();
		} else if (haveFieldsChanged) {
			handleSubmit();
		} else if (storedPubkyData?.signedUp) {
			// If signed up but no fields changed, clear error
			clearErrorState();
		}
	}, [homeServer, storedPubkyData?.homeserver, storedPubkyData?.signedUp, signupToken, haveFieldsChanged, handleSubmit, clearErrorState]);

	const isSignupTokenEditable = useMemo(() => {
		// Not editable when loading or when already signed up with the same homeserver
		return !(loading || (storedPubkyData?.signedUp && storedPubkyData.homeserver === homeServer.trim()));
	}, [loading, homeServer, storedPubkyData.homeserver, storedPubkyData?.signedUp]);

	const title = useMemo(() => {
		return `${payload?.title} pk:${truncatePubky(pubky)}` ?? TITLE;
	}, [payload?.title, pubky]);

	const onClose = useCallback(() => {
		SheetManager.hide('edit-pubky');
	}, []);

	const checkMarkGradient = useMemo(() => {
		return error ? ONBOARDING_KEY_ERROR_RADIAL_GRADIENT : ONBOARDING_KEY_RADIAL_GRADIENT;
	}, [error]);

	const checkMarkImage = useMemo(() => {
		return error ? require('../images/cross.png') : require('../images/check.png');
	}, [error]);

	const onReset = useCallback(() => {
		try {
			// Clear any active timers
			if (fadeOutTimerRef.current) {
				clearTimeout(fadeOutTimerRef.current);
				fadeOutTimerRef.current = null;
			}

			if (checkOpacity?.value) {
				checkOpacity.value = withTiming(0, { duration: 0 });
			}
			if (gradientOpacity?.value) {
				gradientOpacity.value = withTiming(0, { duration: 0 });
			}
			if (checkScale?.value) {
				checkScale.value = withSpring(0, { duration: 0 });
			}

			setError('');
			setHomeServer(storedPubkyData?.homeserver ?? '');
			setNewPubkyName(storedPubkyData?.name ?? '');
			setSignupToken('');
		} catch (e) {
			console.log('Reset error:', e);
		}
	}, [checkOpacity, checkScale, gradientOpacity, storedPubkyData]);

	// Clear error state when save button becomes disabled (fields revert to original values)
	useEffect(() => {
		if (storedPubkyData?.signedUp && !haveFieldsChanged && error) {
			onReset();
		}
	}, [storedPubkyData?.signedUp, haveFieldsChanged, error, clearErrorState, onReset]);

	// Add a cleanup effect to clear timers when component unmounts
	useEffect(() => {
		return (): void => {
			if (fadeOutTimerRef.current) {
				clearTimeout(fadeOutTimerRef.current);
			}
		};
	}, []);

	const handleSignupTokenChange = useCallback((text: string) => {
		const formatted = formatSignupTokenForHomeserver(text);
		setSignupToken(formatted);
	}, [formatSignupTokenForHomeserver]);

	const inputData = useMemo(() => {
		const items: InputDataItem[] = [
			{
				id: 'name' as const,
				value: newPubkyName,
				onChange: handleChangeText,
				placeholder: 'Pubky Name',
				error: nameError,
				autoFocus: true,
			},
		];

		if (isSignupTokenInputVisible) {
			items.push({
				id: 'signuptoken' as const,
				value: signupToken,
				onChange: handleSignupTokenChange,
				placeholder: 'Invite Code (Optional)',
				error: '',
				autoFocus: false,
			});
		}

		items.push({
			id: 'homeserver' as const,
			value: homeServer,
			onChange: setHomeServer,
			placeholder: 'Homeserver',
			error: '',
			autoFocus: false,
		});

		return items;
	}, [newPubkyName, handleChangeText, nameError, isSignupTokenInputVisible, homeServer, signupToken, handleSignupTokenChange]);

	const renderListHeader = useCallback(() => {
		return (
			<>
				<ModalIndicator />
				<Text style={styles.title}>{title}</Text>
			</>
		);
	}, [title]);

	const footerTop = useMemo(() => {
		return null;
	}, []);

	const renderListFooter = useCallback(() => {
		return (
			<View style={[styles.footerContainer, { top: footerTop }]}>
				{error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : null}
				<View style={styles.imageContainer}>
					<AnimatedView style={[styles.imageWrapper, checkStyle]}>
						<Image
							source={checkMarkImage}
							style={styles.checkImage}
							resizeMode="contain"
						/>
					</AnimatedView>
				</View>
			</View>
		);
	}, [error, checkStyle, checkMarkImage, footerTop]);

	const leftButtonText = useMemo(() => {
		if (storedPubkyData.homeserver && haveFieldsChanged) {
			return loading ? 'Close' : 'Reset';
		}
		return 'Close';
	}, [storedPubkyData.homeserver, haveFieldsChanged, loading]);

	const leftButtonOnPress = useCallback(() => {
		if (storedPubkyData.homeserver && haveFieldsChanged) {
			return loading ? onClose() : onReset();
		}
		return onClose();
	}, [storedPubkyData.homeserver, haveFieldsChanged, loading, onClose, onReset]);

	// eslint-disable-next-line react/no-unused-prop-types
	const renderInputItem = useCallback(({ item }: { item: InputDataItem }) => {
		if (item.id === 'signuptoken') {
			return (
				<>
					<Text style={styles.textInputTitle}>{textInputTitleText?.signuptoken}</Text>
					<InputItemComponent
						inputRef={signupTokenInputRef}
						value={item.value}
						onChangeText={item.onChange}
						placeholder={item.placeholder}
						error={item.error}
						autoFocus={item.autoFocus}
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
			);
		}

		if (item.id === 'name') {
			return (
				<>
					<Text style={styles.textInputTitle}>
						{textInputTitleText[item.id]}
					</Text>
					<InputItemComponent
						value={item.value}
						onChangeText={item.onChange}
						placeholder={item.placeholder}
						error={item.error}
						autoFocus={item.autoFocus}
						onSubmitEditing={handleNameSubmit}
					/>
				</>
			);
		}

		// For homeserver input
		return (
			<>
				<Text style={styles.textInputTitle}>
					{textInputTitleText[item.id]}
				</Text>
				<InputItemComponent
					value={item.value}
					onChangeText={item.onChange}
					placeholder={item.placeholder}
					error={item.error}
					autoFocus={item.autoFocus}
					onSubmitEditing={handleHomeserverSubmit}
				/>
			</>
		);
	}, [isSignupTokenEditable, handleSubmit, handleNameSubmit, handleHomeserverSubmit, haveFieldsChanged, storedPubkyData?.signedUp, clearErrorState]);

	return (
		<ActionSheetContainer
			id="edit-pubky"
			navigationAnimation={navigationAnimation}
			keyboardHandlerEnabled={Platform.OS === 'ios'}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={ACTION_SHEET_HEIGHT}
		>
			<SkiaGradient modal={true} style={styles.content}>
				<View style={[styles.content, styles.container]}>
					<AnimatedView style={gradientStyle}>
						<RadialGradient
							style={styles.radialGradient}
							colors={checkMarkGradient}
							center={{ x: 0.5, y: 0.5 }}
							positions={[0, 0.2, 0.4, 0.6, 0.8, 1]}
						/>
					</AnimatedView>

					<KeyboardAvoidingView
						style={styles.flatListWrapper}
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
					>
						<FlashList
							data={inputData}
							renderItem={renderInputItem}
							estimatedItemSize={120}
							keyExtractor={(item) => item.id}
							showsVerticalScrollIndicator={false}
							ListHeaderComponent={renderListHeader}
							ListFooterComponent={renderListFooter}
							ListFooterComponentStyle={styles.listFooter}
							keyboardShouldPersistTaps="handled"
						/>

						<View style={styles.buttonContainer}>
							<Button
								text={leftButtonText}
								style={styles.button}
								onPress={leftButtonOnPress}
							/>
							<Button
								text={'Save'}
								loading={loading}
								style={[styles.button, styles.submitButton]}
								onPress={handleSubmit}
								disabled={storedPubkyData?.signedUp && !haveFieldsChanged}
							/>
						</View>
					</KeyboardAvoidingView>
				</View>
			</SkiaGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingBottom: 24,
		minHeight: '40%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		height: '100%',
		flexDirection: 'column',
		backgroundColor: 'transparent',
	},
	container: {
		backgroundColor: 'transparent',
	},
	flatListWrapper: {
		height: '100%',
		backgroundColor: 'transparent',
		paddingHorizontal: 24,
		zIndex: 1,
		position: 'relative',
	},
	radialGradient: {
		width: '100%',
		height: '100%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		marginBottom: 24,
		alignSelf: 'center',
	},
	textInputTitle: {
		fontSize: 15,
		lineHeight: 22,
		alignItems: 'center',
	},
	inputWrapper: {
		marginTop: 8,
		marginBottom: 12,
		backgroundColor: 'transparent',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#5D5D5D',
		borderRadius: 16,
		borderStyle: 'dashed',
		height: 74,
		backgroundColor: 'transparent',
	},
	input: {
		flex: 1,
		paddingLeft: 16,
		fontSize: 26,
		fontWeight: '300',
		lineHeight: 32,
		textAlignVertical: 'center',
		left: Platform.select({
			android: 4,
			ios: 0,
		}),
		backgroundColor: 'transparent',
	},
	inputError: {
		borderColor: '#dc2626',
	},
	errorText: {
		color: '#dc2626',
		fontSize: 15,
		textAlign: 'center',
		marginTop: 4,
	},
	buttonContainer: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-around',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	button: {
		width: '47%',
		minHeight: 64,
	},
	submitButton: {
		borderWidth: 1,
	},
	footerContainer: {
		paddingBottom: 16,
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	listFooter: {
		marginBottom: 16,
	},
	imageContainer: {
		height: 160,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
		marginTop: 10,
	},
	imageWrapper: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	checkImage: {
		width: 150,
		height: 150,
	},
});

export default memo(EditPubky);
