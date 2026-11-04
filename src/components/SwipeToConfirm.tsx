import React, { memo, ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
	clamp,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LocalSvg } from 'react-native-svg/css';
import { useTheme } from 'styled-components/native';
import type { Theme } from '../theme';
import { TextSmB } from '../theme/typography';
import { LinearGradient } from './LinearGradient';

const HANDLE_SIZE = 60;
const PADDING = 8;

interface SwipeToConfirmProps {
	text: string;
	loading?: boolean;
	disabled?: boolean;
	testID?: string;
	onConfirm: () => Promise<void>;
}

const SwipeToConfirm = ({
	text,
	loading = false,
	disabled = false,
	testID,
	onConfirm,
}: SwipeToConfirmProps): ReactElement => {
	const theme = useTheme() as Theme;
	const [width, setWidth] = useState(0);
	const [pending, setPending] = useState(false);
	const inFlight = useRef(false);
	const panX = useSharedValue(0);
	const committed = useSharedValue(false);
	const maxPanX = Math.max(0, width - HANDLE_SIZE - PADDING * 2);
	const busy = loading || pending;

	useEffect(() => {
		panX.set(withTiming(busy ? maxPanX : 0));
	}, [busy, maxPanX, panX]);

	const confirm = useCallback(async (): Promise<void> => {
		if (inFlight.current || loading || disabled) return;
		inFlight.current = true;
		setPending(true);
		try {
			await onConfirm();
		} finally {
			inFlight.current = false;
			setPending(false);
			committed.set(false);
			panX.set(withSpring(0));
		}
	}, [committed, disabled, loading, onConfirm, panX]);

	const pan = usePanGesture({
		enabled: !busy && !disabled && maxPanX > 0,
		testID: `${testID}-Pan`,
		activeOffsetX: [-8, 8],
		failOffsetY: [-16, 16],
		onUpdate: event => {
			if (!committed.get()) panX.set(clamp(event.translationX, 0, maxPanX));
		},
		onDeactivate: event => {
			if (!event.canceled && !committed.get() && maxPanX > 0 && panX.get() >= maxPanX * 0.8) {
				committed.set(true);
				panX.set(withSpring(maxPanX));
				scheduleOnRN(confirm);
			} else if (!committed.get()) {
				panX.set(withSpring(0));
			}
		},
		onFinalize: () => {
			if (!committed.get()) panX.set(withSpring(0));
		},
	});

	const handleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: panX.get() }] }));
	const trailStyle = useAnimatedStyle(() => ({ width: panX.get() + HANDLE_SIZE }));
	const labelStyle = useAnimatedStyle(() => ({
		opacity: maxPanX > 0 ? clamp(1 - panX.get() / maxPanX, 0, 1) : 1,
	}));

	return (
		<View
			testID={testID}
			style={[styles.root, disabled && styles.disabled]}
			onLayout={event => setWidth(event.nativeEvent.layout.width)}
		>
			<LinearGradient colors={['#2A2A2A', '#1C1C1C']} style={styles.track}>
				<Animated.View style={[styles.trail, { backgroundColor: `${theme.colors.blue}24` }, trailStyle]} />
				<Animated.View
					style={[styles.label, labelStyle]}
					pointerEvents="none"
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
				>
					<TextSmB style={styles.labelText}>{text}</TextSmB>
				</Animated.View>
				<GestureDetector gesture={pan}>
					<Animated.View
						accessible
						accessibilityRole="button"
						accessibilityLabel={text}
						accessibilityState={{ disabled: disabled || busy, busy }}
						accessibilityActions={[{ name: 'activate' }]}
						onAccessibilityAction={event => {
							if (event.nativeEvent.actionName === 'activate') confirm();
						}}
						onAccessibilityTap={confirm}
						style={[styles.handle, { backgroundColor: theme.colors.blue }, handleStyle]}
						testID={`${testID}-Handle`}
					>
						{busy ? (
							<ActivityIndicator color={theme.colors.background} />
						) : (
							<View style={styles.arrow}>
								<LocalSvg asset={require('../images/swipe-arrow.svg')} />
							</View>
						)}
					</Animated.View>
				</GestureDetector>
			</LinearGradient>
		</View>
	);
};

const styles = StyleSheet.create({
	root: { height: HANDLE_SIZE + PADDING * 2, borderRadius: 60, overflow: 'hidden' },
	track: { padding: PADDING, justifyContent: 'center' },
	trail: { position: 'absolute', left: PADDING, top: PADDING, bottom: PADDING, borderRadius: 60 },
	handle: {
		width: HANDLE_SIZE,
		height: HANDLE_SIZE,
		borderRadius: 30,
		alignItems: 'center',
		justifyContent: 'center',
	},
	arrow: { transform: [{ rotate: '-90deg' }] },
	label: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: HANDLE_SIZE + PADDING,
	},
	labelText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
	disabled: { opacity: 0.4 },
});

export default memo(SwipeToConfirm);
