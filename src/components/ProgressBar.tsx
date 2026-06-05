import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
	Easing,
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type ProgressBarProps = {
	duration?: number; // ms
	delayStart?: number; // delay before animation starts (ms)
	delayRender?: number; // delay before rendering the component (ms)
	fadeIn?: boolean; // if true, fades in the bar when it appears
	fadeInDuration?: number; // fade in animation duration (ms)
	unfilledColor?: string;
	filledColor?: string;
	height?: number;
	borderRadius?: number;
	reverse?: boolean; // if true, anchors progress to the right edge
	drain?: boolean; // if true, progress starts full and drains to empty
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
	drain = false,
	onComplete,
	style,
}: ProgressBarProps): React.ReactElement | null => {
	const [shouldRender, setShouldRender] = useState(delayRender === 0);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const progress = useSharedValue(drain ? 1 : 0);
	const opacity = useSharedValue(fadeIn ? 0 : 1);
	const completedOnce = useRef(false);

	const containerStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const progressStyle = useAnimatedStyle(() => {
		const width = progress.value * dimensions.width;

		return {
			width,
			left: reverse ? dimensions.width - width : 0,
		};
	});

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
		if (!shouldRender || dimensions.width === 0) return;

		// restart animation whenever duration or delay changes
		completedOnce.current = false;
		cancelAnimation(progress);
		cancelAnimation(opacity);
		progress.value = drain ? 1 : 0;
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
			progress.value = withTiming(drain ? 0 : 1, { duration, easing: Easing.linear }, finished => {
				if (finished && onComplete && !completedOnce.current) {
					completedOnce.current = true;
					scheduleOnRN(onComplete);
				}
			});
		}, delayStart);

		return (): void => {
			clearTimeout(timer);
			cancelAnimation(progress);
			cancelAnimation(opacity);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shouldRender, dimensions.width, duration, delayStart, fadeIn, fadeInDuration, drain, onComplete]);

	if (!shouldRender) {
		return (
			<View
				style={[
					styles.container,
					//eslint-disable-next-line react-native/no-inline-styles
					{ height, borderRadius },
					style,
				]}
			/>
		);
	}

	return (
		<Animated.View
			style={[
				styles.container,
				//eslint-disable-next-line react-native/no-inline-styles
				{ height, borderRadius, overflow: 'hidden', backgroundColor: unfilledColor },
				containerStyle,
				style,
			]}
			onLayout={e => {
				setDimensions({
					width: e.nativeEvent.layout.width,
					height: e.nativeEvent.layout.height,
				});
			}}
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 1, now: undefined }}
		>
			{dimensions.width > 0 && (
				<Animated.View
					style={[
						styles.progress,
						//eslint-disable-next-line react-native/no-inline-styles
						{ height: dimensions.height, borderRadius, backgroundColor: filledColor },
						progressStyle,
					]}
				/>
			)}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	progress: {
		position: 'absolute',
		top: 0,
	},
});

export default memo(ProgressBar);
