import React, { memo, ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TextSmB } from '../theme/typography';
import { ChevronLeft, ChevronRight } from '../icons/index.ts';

const pubkyRingLogo = require('../images/pubky-ring-logo-small.png');

interface AnimatedQRData {
	value: string;
}

interface AnimatedQRProps {
	data: AnimatedQRData[];
	/** Target cycle interval in ms (default: 600ms) */
	cycleInterval?: number;
	/** Initial fast cycle interval in ms. If not set, uses cycleInterval immediately */
	startCycleInterval?: number;
	/** Duration in ms to transition from startCycleInterval to cycleInterval (default: 5000ms) */
	transitionDuration?: number;
	size?: number;
}

const CHEVRON_HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };

const AnimatedQR = ({
	data,
	cycleInterval = 600,
	startCycleInterval,
	transitionDuration = 5000,
	size = 250,
}: AnimatedQRProps): ReactElement => {
	const { t } = useTranslation();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const startTimeRef = useRef<number | null>(null);
	const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const controlsOpacity = useSharedValue(0);
	const hasTransition = startCycleInterval !== undefined && startCycleInterval !== cycleInterval;

	// Use ref for interval calculation to avoid dependency churn in cycling effect
	const getIntervalRef = useRef(() => cycleInterval);

	// Update the interval calculation function when dependencies change
	useEffect(() => {
		startTimeRef.current = Date.now();
		getIntervalRef.current = (): number => {
			if (!hasTransition) {
				return cycleInterval;
			}

			const startTime = startTimeRef.current ?? Date.now();
			const elapsed = Date.now() - startTime;
			if (elapsed >= transitionDuration) {
				return cycleInterval;
			}

			// Linear interpolation from startCycleInterval to cycleInterval
			const progress = elapsed / transitionDuration;
			const intervalRange = cycleInterval - (startCycleInterval ?? cycleInterval);
			return Math.round((startCycleInterval ?? cycleInterval) + intervalRange * progress);
		};
	}, [hasTransition, cycleInterval, startCycleInterval, transitionDuration]);

	// Animate controls opacity when pause state changes
	useEffect(() => {
		controlsOpacity.value = withTiming(isPaused ? 1 : 0, { duration: 200 });
	}, [isPaused, controlsOpacity]);

	// Animated style for controls opacity
	const controlsAnimatedStyle = useAnimatedStyle(() => ({
		opacity: controlsOpacity.value,
	}));

	// Cycle through data items with dynamic interval
	useEffect(() => {
		if (data.length <= 1 || isPaused) {
			return;
		}

		const scheduleNext = (): void => {
			const interval = getIntervalRef.current();

			timeoutIdRef.current = setTimeout(() => {
				setCurrentIndex(prev => (prev + 1) % data.length);
				scheduleNext();
			}, interval);
		};

		scheduleNext();

		return (): void => {
			if (timeoutIdRef.current) {
				clearTimeout(timeoutIdRef.current);
				timeoutIdRef.current = null;
			}
		};
	}, [data.length, isPaused]);

	const handleQRPress = useCallback((): void => {
		if (timeoutIdRef.current) {
			clearTimeout(timeoutIdRef.current);
			timeoutIdRef.current = null;
		}
		setIsPaused(prev => !prev);
	}, []);

	const handlePrevious = useCallback((): void => {
		setCurrentIndex(prev => (prev === 0 ? data.length - 1 : prev - 1));
	}, [data.length]);

	const handleNext = useCallback((): void => {
		setCurrentIndex(prev => (prev + 1) % data.length);
	}, [data.length]);

	const currentItem = data[currentIndex];
	const showControls = isPaused && data.length > 1;

	return (
		<>
			<View style={styles.qrContainer}>
				<Pressable onPress={handleQRPress} style={styles.qrPressable}>
					<View style={styles.qrBackground}>
						<QRCode
							value={currentItem?.value || 'empty'}
							size={size}
							backgroundColor="#FFFFFF"
							logo={pubkyRingLogo}
							logoSize={60}
							logoMargin={0}
							logoBackgroundColor="black"
							logoBorderRadius={30}
						/>
					</View>

					{showControls && (
						<>
							<Animated.View
								style={[styles.chevron, styles.chevronLeft, controlsAnimatedStyle]}
								pointerEvents={isPaused ? 'auto' : 'none'}
							>
								<Pressable onPress={handlePrevious} hitSlop={CHEVRON_HIT_SLOP}>
									<ChevronLeft size={32} />
								</Pressable>
							</Animated.View>
							<Animated.View
								style={[styles.chevron, styles.chevronRight, controlsAnimatedStyle]}
								pointerEvents={isPaused ? 'auto' : 'none'}
							>
								<Pressable onPress={handleNext} hitSlop={CHEVRON_HIT_SLOP}>
									<ChevronRight size={32} />
								</Pressable>
							</Animated.View>
						</>
					)}
				</Pressable>
			</View>

			{isPaused && (
				<TextSmB style={styles.progressText} colorName="secondaryForeground">
					{t('settings.keyProgress', { current: currentIndex + 1, total: data.length })}
				</TextSmB>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	qrContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	qrPressable: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
	},
	qrBackground: {
		backgroundColor: '#FFFFFF',
		padding: 16,
		borderRadius: 16,
	},
	chevron: {
		position: 'absolute',
		top: '50%',
		transform: [{ translateY: -16 }],
	},
	chevronLeft: {
		left: -40,
	},
	chevronRight: {
		right: -40,
	},
	progressText: {
		textAlign: 'center',
		marginTop: 16,
		marginBottom: 16,
	},
});

export default memo(AnimatedQR);
