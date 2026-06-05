import React, { memo, useEffect, useRef, useState } from 'react';
import Svg, { Circle } from 'react-native-svg';

type CircularProgressBarProps = {
	duration?: number;
	size?: number;
	strokeWidth?: number;
	unfilledColor?: string;
	filledColor?: string;
	drain?: boolean;
	onComplete?: () => void;
};

const CircularProgressBar = ({
	duration = 20000,
	size = 24,
	strokeWidth = 2,
	unfilledColor = '#333333',
	filledColor = '#FFFFFF',
	drain = false,
	onComplete,
}: CircularProgressBarProps): React.ReactElement => {
	const [progress, setProgress] = useState(drain ? 1 : 0);
	const animationFrame = useRef<number | null>(null);
	const completedOnce = useRef(false);
	const onCompleteRef = useRef(onComplete);
	const radius = (size - strokeWidth) / 2;
	const center = size / 2;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference * (1 - progress);

	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	useEffect(() => {
		const startTime = Date.now();
		const safeDuration = Math.max(duration, 1);

		completedOnce.current = false;
		setProgress(drain ? 1 : 0);

		const updateProgress = (): void => {
			const elapsed = Date.now() - startTime;
			const nextProgress = Math.min(elapsed / safeDuration, 1);

			setProgress(drain ? 1 - nextProgress : nextProgress);

			if (nextProgress >= 1) {
				if (onCompleteRef.current && !completedOnce.current) {
					completedOnce.current = true;
					onCompleteRef.current();
				}
				return;
			}

			animationFrame.current = requestAnimationFrame(updateProgress);
		};

		animationFrame.current = requestAnimationFrame(updateProgress);

		return (): void => {
			if (animationFrame.current !== null) {
				cancelAnimationFrame(animationFrame.current);
				animationFrame.current = null;
			}
		};
	}, [duration, drain]);

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
			<Circle
				cx={center}
				cy={center}
				r={radius}
				stroke={filledColor}
				strokeWidth={strokeWidth}
				fill="none"
				strokeLinecap="round"
				strokeDasharray={`${circumference} ${circumference}`}
				strokeDashoffset={strokeDashoffset}
			/>
		</Svg>
	);
};

export default memo(CircularProgressBar);
