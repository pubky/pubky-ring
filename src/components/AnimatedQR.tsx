import React, { memo, ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Text, View, ChevronLeft, ChevronRight, AnimatedView } from '../theme/components.ts';
import { useTranslation } from 'react-i18next';
import {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	SharedValue,
} from 'react-native-reanimated';

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

interface QRLayerProps {
	index: number;
	item: AnimatedQRData;
	size: number;
	currentIndex: SharedValue<number>;
}

const CHEVRON_HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };

const QRLayer = memo(({ index, item, size, currentIndex }: QRLayerProps): ReactElement => {
	const style = useAnimatedStyle(() => ({
		opacity: currentIndex.value === index ? 1 : 0,
	}));
	return (
		<AnimatedView style={[styles.qrLayer, index > 0 && styles.qrLayerAbsolute, style]}>
			<QRCode
				value={item.value || 'empty'}
				size={size}
				backgroundColor="#FFFFFF"
				logo={pubkyRingLogo}
				logoSize={45}
				logoMargin={0}
				logoBackgroundColor="black"
				logoBorderRadius={20.5}
			/>
		</AnimatedView>
	);
});

const AnimatedQR = ({
	data,
	cycleInterval = 600,
	startCycleInterval,
	transitionDuration = 5000,
	size = 250,
}: AnimatedQRProps): ReactElement => {
	const { t } = useTranslation();
	const currentIndex = useSharedValue(0);
	const [currentIndexJS, setCurrentIndexJS] = useState(0);
	const [isPaused, setIsPaused] = useState(false);
	const startTimeRef = useRef<number>(Date.now());
	const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const controlsOpacity = useSharedValue(0);
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

	// Clamp currentIndex if data length changes
	useEffect(() => {
		if (data.length > 0 && currentIndex.value >= data.length) {
			currentIndex.value = 0;
			setCurrentIndexJS(0);
		}
	}, [data.length, currentIndex]);

	// Animate controls opacity when pause state changes
	useEffect(() => {
		controlsOpacity.value = withTiming(isPaused ? 1 : 0, { duration: 200 });
	}, [isPaused, controlsOpacity]);

	// Animated style for controls opacity
	const controlsAnimatedStyle = useAnimatedStyle(() => ({
		opacity: controlsOpacity.value,
	}));

	// Cycle through data items with dynamic interval (no React state updates)
	useEffect(() => {
		if (data.length <= 1 || isPaused) {
			return;
		}

		const scheduleNext = (): void => {
			const interval = getIntervalRef.current();

			timeoutIdRef.current = setTimeout(() => {
				currentIndex.value = (currentIndex.value + 1) % data.length;
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
	}, [data.length, isPaused, currentIndex]);

	const handleQRPress = useCallback((): void => {
		if (timeoutIdRef.current) {
			clearTimeout(timeoutIdRef.current);
			timeoutIdRef.current = null;
		}
		setIsPaused(prev => {
			if (!prev) {
				// Pausing: sync JS state for progress text
				setCurrentIndexJS(currentIndex.value);
			}
			return !prev;
		});
	}, [currentIndex]);

	const handlePrevious = useCallback((): void => {
		const newIndex = currentIndex.value === 0 ? data.length - 1 : currentIndex.value - 1;
		currentIndex.value = newIndex;
		setCurrentIndexJS(newIndex);
	}, [data.length, currentIndex]);

	const handleNext = useCallback((): void => {
		const newIndex = (currentIndex.value + 1) % data.length;
		currentIndex.value = newIndex;
		setCurrentIndexJS(newIndex);
	}, [data.length, currentIndex]);

	const showControls = isPaused && data.length > 1;

	return (
		<>
			<View style={styles.qrContainer}>
				<Pressable onPress={handleQRPress} style={styles.qrPressable}>
					<View style={styles.qrBackground}>
						{data.map((item, index) => (
							<QRLayer
								key={index}
								index={index}
								item={item}
								size={size}
								currentIndex={currentIndex}
							/>
						))}
					</View>
					{showControls && (
						<>
							<AnimatedView
								style={[styles.chevronLeft, controlsAnimatedStyle]}
								pointerEvents={isPaused ? 'auto' : 'none'}
							>
								<Pressable onPress={handlePrevious} hitSlop={CHEVRON_HIT_SLOP}>
									<ChevronLeft size={32} />
								</Pressable>
							</AnimatedView>
							<AnimatedView
								style={[styles.chevronRight, controlsAnimatedStyle]}
								pointerEvents={isPaused ? 'auto' : 'none'}
							>
								<Pressable onPress={handleNext} hitSlop={CHEVRON_HIT_SLOP}>
									<ChevronRight size={32} />
								</Pressable>
							</AnimatedView>
						</>
					)}
				</Pressable>
			</View>
			{isPaused && (
				<Text style={styles.progressText}>
					{t('settings.keyProgress', { current: currentIndexJS + 1, total: data.length })}
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
	qrLayer: {},
	qrLayerAbsolute: {
		position: 'absolute',
		top: 16,
		left: 16,
		right: 16,
		bottom: 16,
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
