import React, { memo, ReactElement, useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { getLoadingModalState } from '../store/selectors/uiSelectors.ts';
import { resetLoadingModal } from '../store/slices/uiSlice.ts';
import { useTranslation } from 'react-i18next';
import {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import { BodyMText, BodySSBText, DisplayText } from '../theme/typography';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

// Animation timing constants
const ROTATION_DURATION = 1600;
const KEY_ROTATION_ANGLE = 90;
const RING_ROTATION_ANGLE = KEY_ROTATION_ANGLE * 2;

// Image scale factor - adjust this single value to resize all loading images
const IMAGE_SCALE = 1.0;
const OUTER_CIRCLE_SIZE = 231 * IMAGE_SCALE;
const INNER_CIRCLE_SIZE = 140 * IMAGE_SCALE;
const KEY_IMAGE_SIZE = 260 * IMAGE_SCALE;

const AddPubkyLoading = ({
	navigation,
}: NativeStackScreenProps<AddPubkyStackParamList, 'Loading'>): ReactElement => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const loadingModalState = useSelector(getLoadingModalState);

	const [showErrorImage, setShowErrorImage] = useState(false);

	// Animation shared values
	const imageOpacity = useSharedValue(1);

	// Separate rotation values for each layer
	const keyRotation = useSharedValue(0);
	const innerCircleRotation = useSharedValue(0);
	const outerCircleRotation = useSharedValue(0);

	// Get error state from Redux
	const isError = loadingModalState.isError;
	const errorMessage = loadingModalState.errorMessage;
	const errorModalTitle = loadingModalState.errorModalTitle;
	const errorDescription = loadingModalState.errorDescription;

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

			return (): void => {
				clearTimeout(swapTimeout);
			};
		}

		imageOpacity.value = withTiming(1, { duration: 300 });
	}, [isError, imageOpacity]);

	// Rotation animations for loading state
	useEffect(() => {
		const timingConfig = { duration: ROTATION_DURATION, easing: Easing.inOut(Easing.ease) };

		if (!isError) {
			// Key rotates: 0 → -90° → 0° (counter-clockwise first)
			keyRotation.value = withRepeat(
				withSequence(withTiming(-KEY_ROTATION_ANGLE, timingConfig), withTiming(0, timingConfig)),
				-1,
				false,
			);

			// Inner circle rotates: 0 → +90° → 0° (clockwise first - opposite to key)
			innerCircleRotation.value = withRepeat(
				withSequence(withTiming(RING_ROTATION_ANGLE, timingConfig), withTiming(0, timingConfig)),
				-1,
				false,
			);

			// Outer circle rotates: 0 → -180° → 0° (counter-clockwise, twice as fast as key)
			outerCircleRotation.value = withRepeat(
				withSequence(withTiming(-RING_ROTATION_ANGLE, timingConfig), withTiming(0, timingConfig)),
				-1,
				false,
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

	const baseError = t('loading.errorDescription');
	const modalTitle = isError ? (errorModalTitle ?? t('loading.errorModalTitle')) : t('loading.modalTitle');
	const title = isError ? null : t('loading.title');
	const description = isError
		? errorDescription
			? errorDescription
			: errorMessage
				? `${baseError} ${errorMessage}`
				: baseError
		: t('loading.description');
	const shouldShowErrorImage = isError && showErrorImage;

	const handleCancel = useCallback((): void => {
		dispatch(resetLoadingModal());
		hideSheet('add-pubky');
	}, [dispatch]);

	const handleTryAgain = useCallback(async () => {
		dispatch(resetLoadingModal());
		navigation.replace('Scanner', { mode: 'signup' });
	}, [dispatch, navigation]);

	return (
		<SheetScreen id="add-pubky" title={modalTitle} gradientType={isError ? 'danger' : 'brand'}>
			<View style={styles.contentLayer}>
				{title && <DisplayText style={styles.headerText}>{title}</DisplayText>}
				<BodyMText>{description}</BodyMText>
				<View style={styles.imageContainer}>
					{shouldShowErrorImage ? (
						<Animated.View style={keyAnimatedStyle}>
							<Image source={require('../images/cross.png')} style={styles.image} resizeMode="contain" />
						</Animated.View>
					) : (
						<View style={styles.layeredImageContainer}>
							<Animated.View style={[styles.circleLayer, outerCircleAnimatedStyle]}>
								<Image
									source={require('../images/circular-outer.png')}
									style={styles.outerCircle}
									resizeMode="contain"
								/>
							</Animated.View>

							<Animated.View style={[styles.circleLayer, innerCircleAnimatedStyle]}>
								<Image
									source={require('../images/circular-inner.png')}
									style={styles.innerCircle}
									resizeMode="contain"
								/>
							</Animated.View>

							<Animated.View style={[styles.circleLayer, keyAnimatedStyle]}>
								<Image source={require('../images/key.png')} style={styles.keyImage} resizeMode="contain" />
							</Animated.View>
						</View>
					)}
				</View>

				{isError ? (
					<View style={styles.buttonContainer}>
						<Button text={t('common.cancel')} size="large" onPress={handleCancel} />
						<Button text={t('loading.tryAgain')} size="large" variant="secondary" onPress={handleTryAgain} />
					</View>
				) : (
					<BodySSBText style={styles.waitText}>{t('loading.pleaseWait')}</BodySSBText>
				)}
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	contentLayer: {
		flex: 1,
	},
	headerText: {
		marginBottom: 20,
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: 320,
		height: 320,
		alignSelf: 'center',
	},
	layeredImageContainer: {
		width: OUTER_CIRCLE_SIZE,
		height: OUTER_CIRCLE_SIZE,
		justifyContent: 'center',
		alignItems: 'center',
	},
	circleLayer: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
	},
	outerCircle: {
		width: OUTER_CIRCLE_SIZE,
		height: OUTER_CIRCLE_SIZE,
	},
	innerCircle: {
		width: INNER_CIRCLE_SIZE,
		height: INNER_CIRCLE_SIZE,
	},
	keyImage: {
		width: KEY_IMAGE_SIZE,
		height: KEY_IMAGE_SIZE,
	},
	waitText: {
		textAlign: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
});

export default memo(AddPubkyLoading);
