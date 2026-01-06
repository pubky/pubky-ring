import React, { memo, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Platform, StyleSheet } from 'react-native';
import {
	ActionSheetContainer,
	AnimatedView,
	RadialGradient,
	SessionText,
	Text,
	View,
} from '../theme/components.ts';
import { useDispatch, useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { getLoadingModalState } from '../store/selectors/uiSelectors.ts';
import { resetLoadingModal } from '../store/slices/uiSlice.ts';
import { getStoredDispatch } from '../store/shapes/ui.ts';
import ModalIndicator from './ModalIndicator.tsx';
import ModalButton from './shared/ModalButton.tsx';
import ModalButtonContainer from './shared/ModalButtonContainer.tsx';
import {
	ACTION_SHEET_HEIGHT,
	BLUE_RADIAL_GRADIENT,
	ONBOARDING_KEY_ERROR_RADIAL_GRADIENT,
	SMALL_SCREEN_ACTION_SHEET_HEIGHT,
} from '../utils/constants.ts';
import { isSmallScreen } from '../utils/helpers.ts';
import { useTranslation } from 'react-i18next';
import {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { SheetManager } from 'react-native-actions-sheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const smallScreen = isSmallScreen();
const actionSheetHeight = smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;

// Animation timing constants
const ROTATION_DURATION = 1600;
const KEY_ROTATION_ANGLE = 90;
const RING_ROTATION_ANGLE = KEY_ROTATION_ANGLE * 2;

// Image scale factor - adjust this single value to resize all loading images
const IMAGE_SCALE = 1.0;
const OUTER_CIRCLE_SIZE = 231 * IMAGE_SCALE;
const INNER_CIRCLE_SIZE = 140 * IMAGE_SCALE;
const KEY_IMAGE_SIZE = 260 * IMAGE_SCALE;

interface LoadingModalPayload {
  modalTitle?: string;
  title?: string;
  description?: string;
  waitText?: string;
  onClose?: () => void;
}

const LoadingModal = ({ payload }: {
  payload?: LoadingModalPayload;
}): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigationAnimation = useSelector(getNavigationAnimation);
	const loadingModalState = useSelector(getLoadingModalState);

	const onClose = useMemo(() => payload?.onClose ?? ((): void => {}), [payload]);

	// Track if we should show error image (delayed to allow fade transition)
	const [showErrorImage, setShowErrorImage] = useState(false);

	// Animation shared values
	const errorGradientOpacity = useSharedValue(0);
	const imageOpacity = useSharedValue(1);

	// Separate rotation values for each layer
	const keyRotation = useSharedValue(0);
	const innerCircleRotation = useSharedValue(0);
	const outerCircleRotation = useSharedValue(0);

	// Get error state from Redux
	const isError = loadingModalState.isError;
	const errorMessage = loadingModalState.errorMessage;

	// Reset loading modal state when component unmounts
	useEffect(() => {
		return (): void => {
			dispatch(resetLoadingModal());
		};
	}, [dispatch]);

	// Trigger animations when isError changes
	useEffect(() => {
		if (isError) {
			// Fade out image
			imageOpacity.value = withTiming(0, { duration: 150 });

			// After fade out, swap image source and fade back in
			const swapTimeout = setTimeout(() => {
				setShowErrorImage(true);
				imageOpacity.value = withTiming(1, { duration: 300 });
			}, 150);

			// Fade in error gradient
			errorGradientOpacity.value = withTiming(1, { duration: 300 });

			return (): void => { clearTimeout(swapTimeout); };
		} else {
			// Reset to loading state
			setShowErrorImage(false);
			imageOpacity.value = withTiming(1, { duration: 300 });
			errorGradientOpacity.value = withTiming(0, { duration: 300 });
		}
	}, [isError, imageOpacity, errorGradientOpacity]);

	// Rotation animations for loading state
	useEffect(() => {
		const timingConfig = { duration: ROTATION_DURATION, easing: Easing.inOut(Easing.ease) };

		if (!isError) {
			// Key rotates: 0 → -90° → 0° (counter-clockwise first)
			keyRotation.value = withRepeat(
				withSequence(
					withTiming(-KEY_ROTATION_ANGLE, timingConfig),
					withTiming(0, timingConfig)
				),
				-1,
				false
			);

			// Inner circle rotates: 0 → +90° → 0° (clockwise first - opposite to key)
			innerCircleRotation.value = withRepeat(
				withSequence(
					withTiming(RING_ROTATION_ANGLE, timingConfig),
					withTiming(0, timingConfig)
				),
				-1,
				false
			);

			// Outer circle rotates: 0 → -180° → 0° (counter-clockwise, twice as fast as key)
			outerCircleRotation.value = withRepeat(
				withSequence(
					withTiming(-RING_ROTATION_ANGLE, timingConfig),
					withTiming(0, timingConfig)
				),
				-1,
				false
			);
		} else {
			// Stop rotation and reset to 0 when in error state
			keyRotation.value = withTiming(0, { duration: 300 });
			innerCircleRotation.value = withTiming(0, { duration: 300 });
			outerCircleRotation.value = withTiming(0, { duration: 300 });
		}
	}, [isError, keyRotation, innerCircleRotation, outerCircleRotation]);

	// Animated styles for each layer
	const keyAnimatedStyle = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
		transform: [{ rotate: `${keyRotation.value}deg` }],
	}));

	const innerCircleAnimatedStyle = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
		transform: [{ rotate: `${innerCircleRotation.value}deg` }],
	}));

	const outerCircleAnimatedStyle = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
		transform: [{ rotate: `${outerCircleRotation.value}deg` }],
	}));

	const errorGradientStyle = useAnimatedStyle(() => ({
		opacity: errorGradientOpacity.value,
	}));

	// Compute display values based on error state
	const modalTitle = useMemo(() => {
		if (isError) {
			return t('loading.errorModalTitle');
		}
		return payload?.modalTitle ?? t('loading.modalTitle');
	}, [isError, payload?.modalTitle, t]);

	const title = useMemo(() => {
		if (isError) {
			return null; // Remove subtitle in error state
		}
		return payload?.title ?? t('loading.title');
	}, [isError, payload?.title, t]);

	const description = useMemo(() => {
		if (isError) {
			const baseError = t('loading.errorDescription');
			return errorMessage
        ? `${baseError} ${errorMessage}`
        : baseError;
		}
		return payload?.description ?? t('loading.description');
	}, [isError, errorMessage, payload?.description, t]);

	const waitText = useMemo(() => payload?.waitText ?? t('loading.pleaseWait'), [payload?.waitText, t]);

	// Button handlers
	const handleCancel = useCallback(async () => {
		dispatch(resetLoadingModal());
		await SheetManager.hide('loading');
	}, [dispatch]);

	const handleTryAgain = useCallback(async () => {
		dispatch(resetLoadingModal());
		await SheetManager.hide('loading');
		// Small delay to allow modal animation to complete
		setTimeout(() => {
			// Get the stored dispatch and open camera
			const storedDispatch = getStoredDispatch();
			if (storedDispatch) {
				// Import dynamically to avoid circular dependency
				import('../utils/actions/inviteAction.ts').then(({ openCameraForRetry }) => {
					openCameraForRetry(storedDispatch);
				});
			}
		}, 150);
	}, [dispatch]);

	return (
		<ActionSheetContainer
			id="loading"
			navigationAnimation={navigationAnimation}
			onClose={onClose}
			keyboardHandlerEnabled={false}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={actionSheetHeight}
		>
			<View style={styles.container}>
				{/* Gradient background layers */}
				<View style={styles.gradientContainer}>
					{/* Base blue gradient */}
					<RadialGradient
						style={styles.backgroundGradient}
						colors={BLUE_RADIAL_GRADIENT}
						center={{ x: 0.5, y: 0.5 }}
					/>
					{/* Error gradient overlay */}
					<AnimatedView style={[styles.errorGradientOverlay, errorGradientStyle]}>
						<RadialGradient
							style={styles.errorGradient}
							colors={ONBOARDING_KEY_ERROR_RADIAL_GRADIENT}
							center={{ x: 0.5, y: 0.5 }}
							positions={[0, 0.2, 0.4, 0.6, 0.8, 1]}
						/>
					</AnimatedView>
				</View>

				{/* Content layer (on top of gradients) */}
				<View style={styles.content}>
					<ModalIndicator />
					<View style={styles.titleContainer}>
						<Text style={styles.title}>{modalTitle}</Text>
					</View>
					{title && <Text style={styles.headerText}>{title}</Text>}
					<SessionText style={styles.message}>{description}</SessionText>
					<View style={styles.imageContainer}>
						{showErrorImage ? (
              // Error state: show cross image
							<AnimatedView style={[styles.imageWrapper, keyAnimatedStyle]}>
								<Image
              		source={require('../images/cross.png')}
              		style={styles.image}
              		resizeMode="contain"
              	/>
							</AnimatedView>
            ) : (
              // Loading state: show layered rotating images
	<View style={styles.layeredImageContainer}>
		{/* Outer circle - bottom layer */}
		<AnimatedView style={[styles.circleLayer, outerCircleAnimatedStyle]}>
			<Image
              			source={require('../images/circular-outer.png')}
              			style={styles.outerCircle}
              			resizeMode="contain"
              		/>
		</AnimatedView>

		{/* Inner circle - middle layer */}
		<AnimatedView style={[styles.circleLayer, innerCircleAnimatedStyle]}>
			<Image
              			source={require('../images/circular-inner.png')}
              			style={styles.innerCircle}
              			resizeMode="contain"
              		/>
		</AnimatedView>

		{/* Key - top layer */}
		<AnimatedView style={[styles.circleLayer, keyAnimatedStyle]}>
			<Image
              			source={require('../images/key.png')}
              			style={styles.keyImage}
              			resizeMode="contain"
              		/>
		</AnimatedView>
	</View>
            )}
					</View>
					{isError ? (
						<ModalButtonContainer>
							<ModalButton
            		text={t('common.cancel')}
            		variant="secondary"
            		width="half"
            		onPress={handleCancel}
            	/>
							<ModalButton
            		text={t('loading.tryAgain')}
            		variant="primary"
            		width="half"
            		onPress={handleTryAgain}
            	/>
						</ModalButtonContainer>
          ) : (
	<>
		<Text style={styles.waitText}>{waitText}</Text>
		<View style={styles.footerBuffer} />
	</>
          )}
				</View>
			</View>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
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
	errorGradientOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		pointerEvents: 'none',
	},
	errorGradient: {
		width: '100%',
		height: '100%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
		zIndex: 1,
		backgroundColor: 'transparent',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		textAlign: 'center',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		fontWeight: '700',
		marginBottom: 20,
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		minHeight: 44,
		backgroundColor: 'transparent',
	},
	imageContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'center',
		alignItems: 'center',
	},
	imageWrapper: {
		backgroundColor: 'transparent',
	},
	image: {
		width: 231,
		height: 231,
		alignSelf: 'center',
	},
	// Layered animation styles
	layeredImageContainer: {
		width: OUTER_CIRCLE_SIZE,
		height: OUTER_CIRCLE_SIZE,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	circleLayer: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	outerCircle: {
		width: OUTER_CIRCLE_SIZE,
		height: OUTER_CIRCLE_SIZE,
		backgroundColor: 'transparent',
	},
	innerCircle: {
		width: INNER_CIRCLE_SIZE,
		height: INNER_CIRCLE_SIZE,
		backgroundColor: 'transparent',
	},
	keyImage: {
		width: KEY_IMAGE_SIZE,
		height: KEY_IMAGE_SIZE,
		backgroundColor: 'transparent',
	},
	waitText: {
		fontWeight: '600',
		fontSize: 15,
		lineHeight: 18,
		textAlign: 'center',
		marginBottom: 12,
		backgroundColor: 'transparent',
	},
	footerBuffer: {
		backgroundColor: 'transparent',
		marginBottom: Platform.select({ ios: 10, android: 20 }),
	},
});

export default memo(LoadingModal);
