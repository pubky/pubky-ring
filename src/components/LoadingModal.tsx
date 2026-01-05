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
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { SheetManager } from 'react-native-actions-sheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const smallScreen = isSmallScreen();
const actionSheetHeight = smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;

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

	// Animated styles
	const imageAnimatedStyle = useAnimatedStyle(() => ({
		opacity: imageOpacity.value,
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

	// Determine which image to show
	const imageSource = showErrorImage
		? require('../images/cross.png')
		: require('../images/authorizing-key.png');

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
						<AnimatedView style={[styles.imageWrapper, imageAnimatedStyle]}>
							<Image
								source={imageSource}
								style={styles.image}
								resizeMode="contain"
							/>
						</AnimatedView>
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
	},
	imageWrapper: {
		backgroundColor: 'transparent',
	},
	image: {
		width: 231,
		height: 231,
		alignSelf: 'center',
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
