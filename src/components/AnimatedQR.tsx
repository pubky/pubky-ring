import React, { memo, ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text, View, ChevronLeft, ChevronRight } from '../theme/components.ts';
import { useTranslation } from 'react-i18next';

const pubkyRingLogo = require('../images/pubky-ring-square.png');

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
	const startTimeRef = useRef<number>(Date.now());
	const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const controlsOpacity = useRef(new Animated.Value(0)).current;
	const isMountedRef = useRef(true);
	const hasTransition = startCycleInterval !== undefined && startCycleInterval !== cycleInterval;

	// Use ref for interval calculation to avoid dependency churn in cycling effect
	const getIntervalRef = useRef(() => cycleInterval);

	// Track mounted state for animation cleanup
	useEffect(() => {
		isMountedRef.current = true;
		return (): void => {
			isMountedRef.current = false;
		};
	}, []);

	// Update the interval calculation function when dependencies change
	useEffect(() => {
		getIntervalRef.current = (): number => {
			if (!hasTransition) {
				return cycleInterval;
			}

			const elapsed = Date.now() - startTimeRef.current;
			if (elapsed >= transitionDuration) {
				return cycleInterval;
			}

			// Linear interpolation from startCycleInterval to cycleInterval
			const progress = elapsed / transitionDuration;
			const intervalRange = cycleInterval - (startCycleInterval ?? cycleInterval);
			return Math.round((startCycleInterval ?? cycleInterval) + (intervalRange * progress));
		};
	}, [hasTransition, cycleInterval, startCycleInterval, transitionDuration]);

	// Animate controls opacity when pause state changes
	useEffect(() => {
		Animated.timing(controlsOpacity, {
			toValue: isPaused ? 1 : 0,
			duration: 200,
			useNativeDriver: true,
		}).start();
	}, [isPaused, controlsOpacity]);

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
							logoSize={45}
							logoMargin={0}
							logoBackgroundColor="black"
							logoBorderRadius={20.5}
						/>
					</View>
					{showControls && (
						<>
							<Animated.View
								style={[styles.chevronLeft, { opacity: controlsOpacity }]}
								pointerEvents={isPaused ? 'auto' : 'none'}
							>
								<Pressable onPress={handlePrevious} hitSlop={CHEVRON_HIT_SLOP}>
									<ChevronLeft size={32} />
								</Pressable>
							</Animated.View>
							<Animated.View
								style={[styles.chevronRight, { opacity: controlsOpacity }]}
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
				<Text style={styles.progressText}>
					{t('settings.keyProgress', { current: currentIndex + 1, total: data.length })}
				</Text>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	qrContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		backgroundColor: 'transparent',
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
	chevronLeft: {
		position: 'absolute',
		left: -40,
		top: '50%',
		transform: [{ translateY: -16 }],
	},
	chevronRight: {
		position: 'absolute',
		right: -40,
		top: '50%',
		transform: [{ translateY: -16 }],
	},
	progressText: {
		fontSize: 15,
		fontWeight: '500',
		lineHeight: 20,
		textAlign: 'center',
		color: '#888',
		marginBottom: 16,
	},
});

export default memo(AnimatedQR);
