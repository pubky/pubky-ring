import React, { memo, ReactElement, useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, Linking, Keyboard, View } from 'react-native';
import { Text } from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import DashedBorder from '../DashedBorder.tsx';
import { formatSignupToken, isValidSignupTokenFormat } from '../../utils/helpers.ts';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { DEFAULT_HOMESERVER, ACCENTS } from '../../utils/constants.ts';
import { getPubkySecretKey, signInToHomeserver, signUpToHomeserver } from '../../utils/pubky.ts';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../types';
import { getPubky } from '../../store/selectors/pubkySelectors.ts';
import { setPubkyData } from '../../store/slices/pubkysSlice.ts';
import i18n from '../../i18n';
import { textStyles } from '../../theme/utils';
import Button from '../Button.tsx';
import { CheckCircle, Gift } from '../../icons/index.ts';

const InviteCode = ({
	payload,
}: {
	payload: {
		pubky: string;
		onContinue?: () => void;
		onRequestInvite?: () => void;
	};
}): ReactElement => {
	const dispatch = useDispatch();
	const { onContinue, onRequestInvite, pubky } = payload;
	const storedPubkyData = useSelector((state: RootState) => getPubky(state, pubky));
	const [inviteCode, setInviteCode] = useState('');
	const [isValid, setIsValid] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('new-pubky-setup');
	}, []);

	useEffect(() => {
		return (): void => {
			if (transitionTimerRef.current) {
				clearTimeout(transitionTimerRef.current);
			}
		};
	}, []);

	const goToNextScreen = useCallback(() => {
		if (transitionTimerRef.current) {
			clearTimeout(transitionTimerRef.current);
		}

		transitionTimerRef.current = setTimeout(() => {
			if (onContinue) {
				onContinue();
			} else {
				closeSheet();
			}
		}, 600);
	}, [onContinue, closeSheet]);

	const handleContinue = useCallback(async () => {
		try {
			Keyboard.dismiss();
			if (!inviteCode) {
				return;
			}
			setLoading(true);

			if (error) {
				setError('');
			}

			const secretKeyRes = await getPubkySecretKey(pubky);
			if (secretKeyRes.isErr()) {
				setError(i18n.t('pubkyErrors.unableToGetSecretKey'));
				return;
			}
			const secretKey = secretKeyRes.value.secretKey;

			const homeserver = DEFAULT_HOMESERVER;

			const newData = {
				name: storedPubkyData?.name || '',
				homeserver,
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
					if (!storedPubkyData?.homeserver || storedPubkyData.homeserver === homeserver) {
						// Attempt sign-in
						const signinRes = await signInToHomeserver({
							pubky,
							homeserver,
							secretKey,
							dispatch,
						});
						if (signinRes.isErr()) {
							setError(i18n.t('pubkyErrors.invalidInviteCode'));
							return;
						}
						signedIn = true;
					} else {
						setError(i18n.t('pubkyErrors.invalidInviteCode'));
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
					return;
				}
			}

			// Update pubky data with the homeserver and signup token
			dispatch(
				setPubkyData({
					pubky,
					data: newData,
				}),
			);

			setError('');
			goToNextScreen();
		} catch (err) {
			console.error('Error during continue:', err);
			setError(i18n.t('pubkyErrors.unexpectedError'));
		} finally {
			setLoading(false);
		}
	}, [pubky, inviteCode, storedPubkyData, dispatch, goToNextScreen, error]);

	const handleInviteCodeChange = useCallback((text: string) => {
		const formatted = formatSignupToken(text);
		setInviteCode(formatted);
		setIsValid(isValidSignupTokenFormat(formatted));
	}, []);

	const handleNeedInvite = useCallback(() => {
		if (onRequestInvite) {
			onRequestInvite();
		} else {
			// Fallback: Open link to get invite code
			Linking.openURL('https://synonym.to/invite');
		}
	}, [onRequestInvite]);

	const inputCheckmarkStyle = useAnimatedStyle(() => ({
		opacity: withTiming(isValid ? 1 : 0, { duration: 300 }),
		transform: [{ scale: withTiming(isValid ? 1 : 0.8, { duration: 300 }) }],
	}));

	return (
		<View style={styles.keyboardAvoidingView}>
			<Text style={styles.headerText}>{i18n.t('inviteCode.title')}</Text>
			<Text style={styles.message}>{i18n.t('inviteCode.description')}</Text>

			<DashedBorder
				style={styles.inputContainer}
				borderColor={inviteCode ? ACCENTS.pubkyRing : 'rgba(255, 255, 255, 0.32)'}
				borderWidth={1}
				borderRadius={16}
				dashWidth={2}
				dashGap={2}
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
				<Animated.View style={[styles.checkmark, inputCheckmarkStyle]}>
					<CheckCircle color={ACCENTS.pubkyRing} size={32} />
				</Animated.View>
			</DashedBorder>

			<View style={styles.needInviteRow}>
				<Button
					text={i18n.t('inviteCode.needInviteCode')}
					size="small"
					icon={<Gift size={20} />}
					onPress={handleNeedInvite}
				/>
			</View>

			{error ? (
				<Text testID="InviteCodeErrorText" style={styles.errorText}>
					{error}
				</Text>
			) : null}

			<View style={styles.footer}>
				<Button
					text={loading ? i18n.t('inviteCode.processing') : i18n.t('common.continue')}
					size="large"
					variant="secondary"
					loading={loading}
					disabled={!isValid}
					testID="InviteCodeContinueButton"
					onPress={handleContinue}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	keyboardAvoidingView: {
		flex: 1,
		zIndex: 1,
	},
	headerText: {
		...textStyles.display,
		marginBottom: 20,
	},
	message: {
		...textStyles.bodyM,
		marginBottom: 24,
		color: 'rgba(255, 255, 255, 0.8)',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingRight: 20,
		marginBottom: 24,
		height: 70,
	},
	input: {
		...textStyles.bodyMSpaced,
		flex: 1,
		color: ACCENTS.pubkyRing,
	},
	checkmark: {
		// backgroundColor: 'rgba(0, 133, 255, 0.2)',
		// borderRadius: '50%',
		// borderWidth: 2,
		// borderColor: ACCENTS.pubkyRing,
		// padding: 2,
	},
	needInviteRow: {
		alignItems: 'flex-start',
		marginBottom: 24,
	},
	errorText: {
		...textStyles.bodyS,
		color: '#dc2626',
		marginBottom: 16,
	},
	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 'auto',
	},
});

export default memo(InviteCode);
