import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import {
	Easing,
	cancelAnimation,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
	View
} from '../theme/components.ts';

type ProgressBarProps = {
  duration?: number;         // ms
  delayStart?: number;       // delay before animation starts (ms)
  delayRender?: number;      // delay before rendering the component (ms)
  fadeIn?: boolean;          // if true, fades in the bar when it appears
  fadeInDuration?: number;   // fade in animation duration (ms)
  unfilledColor?: string;
  filledColor?: string;
  height?: number;
  borderRadius?: number;
  reverse?: boolean;         // if true, progress fills from right to left
  onComplete?: () => void;
  style?: ViewStyle | ViewStyle[];
};

const ProgressBar = ({
	duration = 20000,
	delayStart = 0,
	delayRender = 0,
	fadeIn = false,
	fadeInDuration = 300,
	unfilledColor = '#E5E5E5',
	filledColor = '#FFFFFF',
	height = 4,
	borderRadius = 2,
	reverse = false,
	onComplete,
	style,
}: ProgressBarProps): React.ReactElement | null => {
	const [shouldRender, setShouldRender] = useState(delayRender === 0);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const progress = useSharedValue(0);
	const opacity = useSharedValue(fadeIn ? 0 : 1);
	const completedOnce = useRef(false);

	// Handle delayed rendering
	useEffect(() => {
		if (delayRender > 0) {
			const renderTimer = setTimeout(() => {
				setShouldRender(true);
			}, delayRender);

			return (): void => {
				clearTimeout(renderTimer);
			};
		}
	}, [delayRender]);

	useEffect(() => {
		if (!shouldRender) return;

		// restart animation whenever duration or delay changes
		completedOnce.current = false;
		cancelAnimation(progress);
		cancelAnimation(opacity);
		progress.value = 0;
		opacity.value = fadeIn ? 0 : 1;

		// Handle fade in animation
		if (fadeIn) {
			opacity.value = withTiming(1, {
				duration: fadeInDuration,
				easing: Easing.ease,
			});
		}

		// Start progress animation after delay
		const timer = setTimeout(() => {
			progress.value = withTiming(
				1,
				{ duration, easing: Easing.linear },
				(finished) => {
					if (finished && onComplete && !completedOnce.current) {
						completedOnce.current = true;
						scheduleOnRN(onComplete);
					}
				},
			);
		}, delayStart);

		return (): void => {
			clearTimeout(timer);
			cancelAnimation(progress);
			cancelAnimation(opacity);
		};
	}, [shouldRender, duration, delayStart, fadeIn, fadeInDuration, onComplete]);

	if (!shouldRender) {
		return (<View style={[
			styles.container,
			{ backgroundColor: 'transparent', height, borderRadius },
			style,
		]}  />);
	}

	return (
		<View
			style={[
				styles.container,
				{ height, borderRadius, overflow: 'hidden', opacity: fadeIn ? undefined : 1 },
				style
			]}
			onLayout={(e) => {
				setDimensions({
					width: e.nativeEvent.layout.width,
					height: e.nativeEvent.layout.height,
				});
			}}
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 1, now: undefined }}
		>
			{dimensions.width > 0 && (
				<Canvas style={styles.canvas}>
					{/* Background (unfilled) */}
					<Rect
						x={0}
						y={0}
						width={dimensions.width}
						height={dimensions.height}
						color={unfilledColor}
						opacity={opacity}
					/>

					{/* Progress (filled) */}
					<Rect
						x={reverse ? dimensions.width : 0}
						y={0}
						width={progress}
						height={dimensions.height}
						color={filledColor}
						opacity={opacity}
						transform={[
							{ translateX: reverse ? -progress : 0 },
							{ scaleX: dimensions.width },
						]}
					/>
				</Canvas>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	canvas: {
		flex: 1,
	},
});

export default memo(ProgressBar);
