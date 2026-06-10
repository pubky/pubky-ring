import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const useReducedMotion = (): boolean => {
	const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

	useEffect(() => {
		let mounted = true;

		AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
			if (mounted) {
				setReducedMotionEnabled(enabled);
			}
		});

		const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotionEnabled);

		return () => {
			mounted = false;
			subscription.remove();
		};
	}, []);

	return reducedMotionEnabled;
};
