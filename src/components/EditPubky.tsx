import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Keyboard, Platform, StyleSheet } from 'react-native';
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
}: {
	value: string;
	onChangeText: (text: string) => void;
	placeholder: string;
	error?: string;
	autoFocus?: boolean;
	onSubmitEditing?: () => void;
	editable?: boolean;
	style?: any;
}): ReactElement => {
	return (
		<View style={[styles.inputWrapper, style]}>
			<View style={[styles.inputContainer, error ? styles.inputError : null]}>
				<TextInput
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
	signuptoken: 'Signup token (optional)',
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
	const [newPubkyName, setNewPubkyName] = useState(storedPubkyData.name || '');
	const [homeServer, setHomeServer] = useState(storedPubkyData.homeserver || DEFAULT_HOMESERVER || '');
	const [signupToken, setSignupToken] = useState(storedPubkyData.signupToken || '');
	const pubkyNameLength = useMemo(() => newPubkyName.length, [newPubkyName.length]);
	const [nameError, setNameError] = useState<string>(pubkyNameLength > 20 ? `${MAX_NAME_LENGTH - pubkyNameLength} / ${MAX_NAME_LENGTH}` : '');
	const dispatch = useDispatch();
	const checkOpacity = useSharedValue(0);
	const checkScale = useSharedValue(0.2);
	const [error, setError] = useState('');

	const signupTokenOpacity = useSharedValue(
		storedPubkyData.signedUp === false || storedPubkyData.homeserver !== (homeServer?.trim() || '') ? 1 : 0
	);

	// Whether signupToken TextInput should be visible
	useEffect(() => {
		const shouldBeVisible = storedPubkyData.signedUp === false || storedPubkyData.homeserver !== (homeServer?.trim() || '');
		signupTokenOpacity.value = withTiming(shouldBeVisible ? 1 : 0, { duration: 300 });
	}, [storedPubkyData.signedUp, storedPubkyData.homeserver, homeServer, signupTokenOpacity]);

	const checkStyle = useAnimatedStyle(() => ({
		opacity: checkOpacity.value,
		transform: [{ scale: checkScale.value }],
		position: 'absolute',
	}));

	const signupTokenStyle = useAnimatedStyle(() => ({
		opacity: signupTokenOpacity.value,
		backgroundColor: 'transparent',
	}));

	const showCheckAnimation = useCallback(({ success }: { success: boolean }) => {
		checkOpacity.value = withTiming(1, { duration: 500 });
		checkScale.value = withSpring(1, {
			damping: 10,
			stiffness: 100,
		});
		if (success) {
			setTimeout(() => {
				checkOpacity.value = withTiming(0, { duration: 3000 });
				setTimeout(() => {
					checkScale.value = 0;
				}, 3005);
			}, 1800);
		}
	}, [checkOpacity, checkScale]);

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
			setLoading(true);
			Keyboard.dismiss();

			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				updateName(); // No need to prevent updating the name if we can.
				return err(secretKeyRes.error.message);
			}
			const secretKey = secretKeyRes.value;

			let newData = {
				name: newPubkyName.trim(),
				homeserver: homeServer.trim(),
				signupToken: storedPubkyData.signupToken,
			};

			if (!storedPubkyData.signedUp || storedPubkyData.homeserver !== homeServer.trim() || storedPubkyData.signupToken !== signupToken.trim()) {
				let signedIn = false;
				if (!storedPubkyData.signedUp || storedPubkyData.homeserver !== homeServer.trim()) {
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
								setError('Unable to sign up with the homeserver. Please update the homeserver and/or signup token and try again.');
								showCheckAnimation({ success: false });
								return;
							}
							signedIn = true;
						} else {
							updateName(); // No need to prevent updating the name if we can.
							setError('Unable to sign up with the homeserver. Please update the homeserver and/or signup token and try again.');
							showCheckAnimation({ success: false });
							return;
						}
					}
					newData = {
						...newData,
						signupToken: signupToken.trim(),
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
	}, [pubky, newPubkyName, homeServer, storedPubkyData.signupToken, storedPubkyData.signedUp, storedPubkyData.homeserver, signupToken, dispatch, showCheckAnimation, updateName]);

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

	const isSignupTokenEditable = useMemo(() => {
		// Not editable when loading or when already signed up with the same homeserver
		return !(loading || (storedPubkyData.signedUp && storedPubkyData.homeserver === homeServer.trim()));
	}, [loading, homeServer, storedPubkyData.homeserver, storedPubkyData.signedUp]);

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

	const inputData = useMemo(() => [
		{
			id: 'name' as const,
			value: newPubkyName,
			onChange: handleChangeText,
			placeholder: 'Pubky Name',
			error: nameError,
			autoFocus: true,
		},
		{
			id: 'homeserver' as const,
			value: homeServer,
			onChange: setHomeServer,
			placeholder: 'Homeserver',
			error: '',
			autoFocus: false,
		},
		{
			id: 'signuptoken' as const,
			value: signupToken,
			onChange: setSignupToken,
			placeholder: 'Signup Token (Optional)',
			error: '',
			autoFocus: false,
		},
	] as InputDataItem[], [newPubkyName, handleChangeText, nameError, homeServer, signupToken]);

	const renderListHeader = useCallback(() => {
		return (
			<>
				<ModalIndicator />
				<Text style={styles.title}>{title}</Text>
			</>
		);
	}, [title]);

	const footerTop = useMemo(() => {
		return isSignupTokenEditable ? null : -100;
	}, [isSignupTokenEditable]);

	const renderListFooter = useCallback(() => {
		return (
			<View style={[styles.footerContainer, { top: footerTop }]}>
				{error ? (
					<Text style={styles.errorText}>{error}</Text>
				) : null}
				<View style={styles.imageContainer}>
					<AnimatedView style={[styles.imageWrapper, checkStyle]}>
						<RadialGradient
							colors={checkMarkGradient}
							center={{ x: 0.5, y: 0.5 }}
						>
							<Image
								source={checkMarkImage}
								style={styles.checkImage}
							/>
						</RadialGradient>
					</AnimatedView>
				</View>
			</View>
		);
	}, [error, checkStyle, checkMarkGradient, checkMarkImage, footerTop]);

	// eslint-disable-next-line react/no-unused-prop-types
	const renderInputItem = useCallback(({ item }: { item: InputDataItem }) => {
		// For the signup token input, apply the animated style
		if (item.id === 'signuptoken') {
			return (
				<AnimatedView style={signupTokenStyle}>
					<Text style={styles.textInputTitle}>{textInputTitleText.signuptoken}</Text>
					<InputItemComponent
						style={styles.signupTokenInput}
						value={item.value}
						onChangeText={item.onChange}
						placeholder={item.placeholder}
						error={item.error}
						autoFocus={item.autoFocus}
						onSubmitEditing={handleSubmit}
						editable={isSignupTokenEditable}
					/>
				</AnimatedView>
			);
		}

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
				/>
			</>
		);
	}, [signupTokenStyle, isSignupTokenEditable, handleSubmit]);

	const onReset = useCallback(() => {
		checkOpacity.value = withTiming(0, { duration: 0 });
		checkScale.value = withSpring(0, {
			duration: 0,
		});
		setError('');
		setHomeServer(storedPubkyData.homeserver);
		setNewPubkyName(storedPubkyData.name);
		setSignupToken(storedPubkyData.signupToken);
	}, [checkOpacity, checkScale, storedPubkyData.homeserver, storedPubkyData.name, storedPubkyData.signupToken]);

	const leftButtonText = useMemo(() => {
		if (storedPubkyData.homeserver && (storedPubkyData.name !== newPubkyName.trim() || storedPubkyData.homeserver !== homeServer.trim() || storedPubkyData.signupToken !== signupToken.trim())) {
			return loading ? 'Close' : 'Reset';
		}
		return 'Close';
	}, [homeServer, loading, newPubkyName, signupToken, storedPubkyData.homeserver, storedPubkyData.name, storedPubkyData.signupToken]);

	const leftButtonOnPress = useCallback(() => {
		if (storedPubkyData.homeserver && (storedPubkyData.name !== newPubkyName.trim() || storedPubkyData.homeserver !== homeServer.trim() || storedPubkyData.signupToken !== signupToken.trim())) {
			return loading ? onClose() : onReset();
		}
		return onClose();
	}, [homeServer, loading, newPubkyName, onClose, onReset, signupToken, storedPubkyData.homeserver, storedPubkyData.name, storedPubkyData.signupToken]);


	return (
		<ActionSheetContainer
			id="edit-pubky"
			navigationAnimation={navigationAnimation}
			keyboardHandlerEnabled={true}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={ACTION_SHEET_HEIGHT}
		>
			<SkiaGradient modal={true} style={styles.content}>
				<FlashList
					data={inputData}
					renderItem={renderInputItem}
					estimatedItemSize={120}
					keyExtractor={(item) => item.id}
					showsVerticalScrollIndicator={false}
					ListHeaderComponent={renderListHeader}
					ListFooterComponent={renderListFooter}
					ListFooterComponentStyle={styles.listFooter}
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
						disabled={storedPubkyData.signedUp && newPubkyName.trim() === storedPubkyData.name && homeServer.trim() === storedPubkyData.homeserver && signupToken.trim() === storedPubkyData.signupToken}
					/>
				</View>
			</SkiaGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 24,
		paddingBottom: 24,
		minHeight: '40%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		height: '100%',
		flexDirection: 'column',
		backgroundColor: 'transparent',
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
	signupTokenInput: {
		marginBottom: 0,
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
