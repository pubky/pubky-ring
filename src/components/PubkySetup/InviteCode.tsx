import React, {
	memo,
	ReactElement,
	useCallback,
	useState,
	useRef,
	useEffect,
	useMemo,
} from 'react';
import {
	StyleSheet,
	TextInput,
	Linking,
	Keyboard,
	Image, Platform,
	Dimensions,
} from 'react-native';
import {
	View,
	Text,
	SessionText,
	RadialGradient,
	AuthorizeButton,
	TouchableOpacity,
	AnimatedView,
} from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import ModalIndicator from '../ModalIndicator.tsx';
import DashedBorder from '../DashedBorder.tsx';
import { Gift, Check } from 'lucide-react-native';
import { formatSignupToken, isSmallScreen, isValidSignupTokenFormat } from '../../utils/helpers.ts';
import {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import {
	DEFAULT_HOMESERVER,
	ONBOARDING_KEY_ERROR_RADIAL_GRADIENT,
	INVITE_CODE_GRADIENT,
} from '../../utils/constants.ts';
import {
	getPubkySecretKey,
	signInToHomeserver,
	signUpToHomeserver,
} from '../../utils/pubky.ts';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../types';
import { getPubky } from '../../store/selectors/pubkySelectors.ts';
import { setPubkyData } from '../../store/slices/pubkysSlice.ts';
import i18n from '../../i18n';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const smallScreen = isSmallScreen();

const InviteCode = ({ payload }: {
    payload: {
        pubky: string;
        onContinue?: () => void;
        onRequestInvite?: () => void;
    };
}): ReactElement => {
	const dispatch = useDispatch();
	const { pubky } = payload;
	const storedPubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const [inviteCode, setInviteCode] = useState('');
	const [isValid, setIsValid] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Animation values
	const checkOpacity = useSharedValue(0);
	const checkScale = useSharedValue(0.2);
	const gradientOpacity = useSharedValue(0);
	const isErrorAnimation = useSharedValue(0); // 0 for success, 1 for error

	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('new-pubky-setup');
	}, []);

	// Cleanup effect for timers
	useEffect(() => {
		return (): void => {
			if (fadeOutTimerRef.current) {
				clearTimeout(fadeOutTimerRef.current);
			}
		};
	}, []);

	const showCheckAnimation = useCallback(({ success }: { success: boolean }) => {
		// Clear any existing timers to prevent conflicting animations
		if (fadeOutTimerRef.current) {
			clearTimeout(fadeOutTimerRef.current);
			fadeOutTimerRef.current = null;
		}

		// Set error state for animation
		isErrorAnimation.value = success ? 0 : 1;

		// Show the animation
		checkOpacity.value = withTiming(1, { duration: 300 });
		gradientOpacity.value = withTiming(1, { duration: 300 });
		checkScale.value = withSpring(1, {
			damping: 12,
			stiffness: 150,
		});

		if (success) {
			// Set a new timer for fade out and transition
			fadeOutTimerRef.current = setTimeout(() => {
				// After success animation, transition to next screen
				if (payload?.onContinue) {
					payload.onContinue();
				} else {
					closeSheet();
				}
			}, 600);
		}
	}, [checkOpacity, checkScale, gradientOpacity, isErrorAnimation, payload, closeSheet]);

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

	const handleContinue = useCallback(async () => {
		try {
			Keyboard.dismiss();
			if (!inviteCode) {
				return;
			}
			setLoading(true);

			// Reset to neutral state if there was a previous error
			if (error) {
				// Fade out any visible animations first
				if (checkOpacity.value > 0 || gradientOpacity.value > 0) {
					checkOpacity.value = withTiming(0, { duration: 200 });
					gradientOpacity.value = withTiming(0, { duration: 200 });
					// Wait for fade out to complete
					await new Promise((resolve): void => {setTimeout(resolve, 250);});
				}
				// Then reset everything to neutral
				setError('');
				checkScale.value = 0;
				isErrorAnimation.value = 0; // Reset to success state
			}

			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				setError(i18n.t('pubkyErrors.unableToGetSecretKey'));
				showCheckAnimation({ success: false });
				return;
			}
			const secretKey = secretKeyRes.value.secretKey;

			// Use DEFAULT_HOMESERVER
			const homeserver = DEFAULT_HOMESERVER;

			let newData = {
				name: storedPubkyData?.name || '',
				homeserver: homeserver,
				signupToken: inviteCode,
			};

			let signedIn = false;

			// Check if we need to sign up or if we're already signed up
			if (!storedPubkyData?.signedUp || storedPubkyData.homeserver !== homeserver) {
				// Attempt sign-up
				const signupRes = await signUpToHomeserver({
					pubky,
					homeserver,
					signupToken: inviteCode,
					secretKey,
					dispatch,
				});
				if (signupRes.isErr()) {
					// The pubky might be an import that can successfully login.
					if (!storedPubkyData.homeserver || storedPubkyData.homeserver === homeserver) {
						// Attempt sign-in
						const signinRes = await signInToHomeserver({
							pubky,
							homeserver,
							secretKey,
							dispatch,
						});
						if (signinRes.isErr()) {
							setError(i18n.t('pubkyErrors.invalidInviteCode'));
							showCheckAnimation({ success: false });
							return;
						}
						signedIn = true;
					} else {
						setError(i18n.t('pubkyErrors.invalidInviteCode'));
						showCheckAnimation({ success: false });
						return;
					}
				}
			}

			if (!signedIn) {
				// Attempt sign-in
				const signinRes = await signInToHomeserver({
					pubky,
					homeserver,
					secretKey,
					dispatch,
				});
				if (signinRes.isErr()) {
					setError(i18n.t('pubkyErrors.unableToSignIn', { error: signinRes.error.message }));
					showCheckAnimation({ success: false });
					return;
				}
			}

			// Update pubky data with the homeserver and signup token
			dispatch(setPubkyData({
				pubky,
				data: newData,
			}));

			setError('');
			showCheckAnimation({ success: true });
		} catch (err) {
			console.error('Error during continue:', err);
			setError(i18n.t('pubkyErrors.unexpectedError'));
			showCheckAnimation({ success: false });
		} finally {
			setLoading(false);
		}
	}, [pubky, inviteCode, storedPubkyData, dispatch, showCheckAnimation, error, checkOpacity, gradientOpacity, checkScale, isErrorAnimation]);

	const handleInviteCodeChange = useCallback((text: string) => {
		const formatted = formatSignupToken(text);
		setInviteCode(formatted);
		setIsValid(isValidSignupTokenFormat(formatted));
	}, []);

	const handleNeedInvite = useCallback(() => {
		if (payload?.onRequestInvite) {
			payload.onRequestInvite();
		} else {
			// Fallback: Open link to get invite code
			Linking.openURL('https://synonym.to/invite');
		}
	}, [payload]);

	// Use memoized values for gradient and image based on error state
	const checkMarkGradient = useMemo(() => {
		return error ? ONBOARDING_KEY_ERROR_RADIAL_GRADIENT : INVITE_CODE_GRADIENT;
	}, [error]);

	const checkMarkImage = useMemo(() => {
		return error ? require('../../images/cross.png') : require('../../images/check.png');
	}, [error]);

	// Animated style for the input checkmark
	const inputCheckmarkStyle = useAnimatedStyle(() => ({
		opacity: withTiming(isValid ? 1 : 0, { duration: 300 }),
		transform: [{ scale: withTiming(isValid ? 1 : 0.8, { duration: 300 }) }],
	}));

	return (
		<View style={styles.container}>
			<View style={styles.gradientContainer}>
				<RadialGradient
					style={styles.backgroundGradient}
					colors={INVITE_CODE_GRADIENT}
					center={{ x: 0.5, y: 0.4 }}
				/>
				<AnimatedView style={gradientStyle}>
					<RadialGradient
						style={styles.radialGradient}
						colors={checkMarkGradient}
						center={{ x: 0.5, y: 0.4 }}
						positions={[0, 0.2, 0.4, 0.6, 0.8, 1]}
					/>
				</AnimatedView>
			</View>
			<View style={styles.keyboardAvoidingView}>
				<View style={styles.content}>
					<ModalIndicator />
					<View style={styles.titleContainer}>
						<Text testID="InviteCodeTitle" style={styles.title}>{i18n.t('welcome.defaultHomeserver')}</Text>
					</View>
					<Text style={styles.headerText}>{i18n.t('inviteCode.title')}</Text>
					<SessionText style={styles.message}>
						{i18n.t('inviteCode.description')}
					</SessionText>

					<DashedBorder
						borderColor="rgba(173, 255, 47, 0.3)"
						borderWidth={2}
						borderRadius={12}
						dashWidth={3}
						dashGap={3}
						style={styles.inputContainer}
					>
						<TextInput
							testID="InviteCodeInput"
							style={styles.input}
							value={inviteCode}
							onChangeText={handleInviteCodeChange}
							onSubmitEditing={handleContinue}
							placeholder="XXXX-XXXX-XXXX"
							placeholderTextColor="rgba(255, 255, 255, 0.2)"
							autoCapitalize="characters"
							autoCorrect={false}
							maxLength={14}
							editable={!loading}
							autoFocus={true}
						/>
						<AnimatedView style={[styles.checkmark, inputCheckmarkStyle]}>
							<Check color="rgba(173, 255, 47, 1)" size={16} />
						</AnimatedView>
					</DashedBorder>

					<TouchableOpacity
						style={styles.needInviteRow}
						onPress={handleNeedInvite}
						activeOpacity={0.7}
					>
						<View style={styles.needInviteContent}>
							<Gift color="rgba(255, 255, 255, 0.8)" size={18} style={styles.giftIcon} />
							<Text style={styles.needInviteText}>{i18n.t('inviteCode.needInviteCode')}</Text>
						</View>
					</TouchableOpacity>

					{error ? (
						<Text testID="InviteCodeErrorText" style={styles.errorText}>{error}</Text>
                    ) : null}
					{!smallScreen && (<View style={styles.imageContainer}>
						<AnimatedView style={[styles.imageWrapper, checkStyle]}>
							<Image
								source={checkMarkImage}
								style={styles.checkImage}
								resizeMode="contain"
							/>
						</AnimatedView>
					</View>)}

					<View style={styles.footer}>
						<AuthorizeButton
							testID="InviteCodeContinueButton"
							style={[styles.continueButton, (!isValid || loading) && styles.continueButtonDisabled]}
							onPressIn={isValid && !loading ? handleContinue : undefined}
							disabled={!isValid || loading}
						>
							<Text
								testID="InviteCodeContinueButtonText"
								style={styles.buttonText}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.8}
							>{loading ? i18n.t('inviteCode.processing') : i18n.t('common.continue')}</Text>
						</AuthorizeButton>
					</View>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	gradientContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: SCREEN_HEIGHT,
		zIndex: 0,
	},
	backgroundGradient: {
		flex: 1,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	keyboardAvoidingView: {
		flex: 1,
		zIndex: 1,
		backgroundColor: 'transparent'
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingBottom: 20,
		backgroundColor: 'transparent',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		marginTop: 24,
		marginBottom: 16,
		fontWeight: '700',
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		marginBottom: 40,
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	inputContainer: {
		paddingHorizontal: 20,
		paddingVertical: 30,
		marginBottom: 30,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'transparent',
		justifyContent: 'center',
	},
	input: {
		flex: 1,
		fontSize: 18,
		fontWeight: '500',
		color: 'rgba(173, 255, 47, 0.8)',
		letterSpacing: 2,
		textAlign: 'left',
		top: -5,
	},
	checkmark: {
		position: 'absolute',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		right: 20,
		borderRadius: 100,
		borderWidth: 3,
		borderColor: 'rgba(173, 255, 47, 0.8)',
		padding: 2,
		marginBottom: 10,
	},
	needInviteRow: {
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
		marginTop: -10,
		backgroundColor: 'transparent',
	},
	needInviteContent: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
	},
	giftIcon: {
		marginRight: 6,
	},
	needInviteText: {
		fontSize: 14,
		fontWeight: '500',
	},
	radialGradient: {
		width: '100%',
		height: '100%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	errorText: {
		color: '#dc2626',
		fontSize: 15,
		textAlign: 'center',
		marginBottom: 16,
	},
	imageContainer: {
		height: 160,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
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
	continueButton: {
		flexDirection: 'row',
		width: '100%',
		minHeight: 64,
		borderRadius: 64,
		paddingVertical: 15,
		paddingHorizontal: 15,
		alignContent: 'center',
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 1)',
		backgroundColor: 'rgba(255, 255, 255, 0.08)'
	},
	continueButtonDisabled: {
		opacity: 0.5,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
	},
	footer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end',
		backgroundColor: 'transparent',
		marginBottom: Platform.select({ ios: 0, android: 20 })
	}
});

export default memo(InviteCode);
