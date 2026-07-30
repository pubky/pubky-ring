import React, { memo, useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
	Easing,
	cancelAnimation,
	useAnimatedProps,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

type CircularProgressBarProps = {
	duration?: number;
	size?: number;
	strokeWidth?: number;
	unfilledColor?: string;
	filledColor?: string;
	drain?: boolean;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgressBar = ({
	duration = 20000,
	size = 24,
	strokeWidth = 1.5,
	unfilledColor = 'transparent',
	filledColor = '#FFFFFF',
	drain = false,
}: CircularProgressBarProps): React.ReactElement => {
	const progress = useSharedValue(drain ? 1 : 0);
	const radius = (size - strokeWidth) / 2;
	const center = size / 2;
	const circumference = 2 * Math.PI * radius;

	const animatedProps = useAnimatedProps(() => ({
		strokeDashoffset: (drain ? -1 : 1) * circumference * (1 - progress.value),
	}));

	useEffect(() => {
		cancelAnimation(progress);
		progress.value = drain ? 1 : 0;
		progress.value = withTiming(drain ? 0 : 1, { duration, easing: Easing.linear });

		return (): void => {
			cancelAnimation(progress);
		};
	}, [duration, drain, progress]);

	return (
		<Svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			style={{ transform: [{ rotate: '-90deg' }] }}
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 1, now: undefined }}
		>
			<Circle
				cx={center}
				cy={center}
				r={radius}
				stroke={unfilledColor}
				strokeWidth={strokeWidth}
				fill="none"
			/>
			<AnimatedCircle
				cx={center}
				cy={center}
				r={radius}
				stroke={filledColor}
				strokeWidth={strokeWidth}
				fill="none"
				strokeLinecap="round"
				strokeDasharray={`${circumference} ${circumference}`}
				strokeDashoffset={0}
				animatedProps={animatedProps}
			/>
		</Svg>
	);
};

export default memo(CircularProgressBar);
