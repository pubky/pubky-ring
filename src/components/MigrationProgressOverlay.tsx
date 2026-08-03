import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
	Easing,
	interpolate,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { subscribeMigrationProgress, MigrationProgress } from '../utils/actions/migrateAction';
import { useTranslation } from 'react-i18next';
import { TextBaseB } from '../theme/typography';
import { accentColors } from '../theme';

const MigrationProgressOverlay = (): React.ReactElement | null => {
	const { t } = useTranslation();
	const [progress, setProgress] = useState<MigrationProgress>({
		current: 0,
		total: 0,
		isActive: false,
		isImporting: false,
	});
	const [isVisible, setIsVisible] = useState(false);

	// Animation values
	const containerOpacity = useSharedValue(0);
	const progressWidth = useSharedValue(0);

	useEffect(() => {
		const unsubscribe = subscribeMigrationProgress(setProgress);
		return unsubscribe;
	}, []);

	// Handle visibility animation
	useEffect(() => {
		const shouldShow = progress.isActive || progress.isImporting;

		if (shouldShow) {
			setIsVisible(true);
		}

		containerOpacity.value = withTiming(
			shouldShow ? 1 : 0,
			{
				duration: 300,
				easing: Easing.ease,
			},
			finished => {
				if (finished && !shouldShow) {
					scheduleOnRN(setIsVisible, false);
				}
			},
		);
	}, [progress.isActive, progress.isImporting, containerOpacity]);

	// Handle progress bar animation
	useEffect(() => {
		if (progress.total > 0) {
			const targetWidth = (progress.current / progress.total) * 100;
			progressWidth.value = withSpring(targetWidth, {
				damping: 40,
				stiffness: 600,
				mass: 0.8,
			});
		}
	}, [progress, progress.total, progressWidth]);

	const containerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: containerOpacity.value,
		transform: [
			{
				translateY: interpolate(containerOpacity.value, [0, 1], [-20, 0]),
			},
		],
	}));

	const progressBarAnimatedStyle = useAnimatedStyle(() => ({
		width: `${progressWidth.value}%`,
	}));

	// Don't render if not active
	if (!progress.isActive && !progress.isImporting && !isVisible) {
		return null;
	}

	return (
		<Animated.View style={[styles.container, containerAnimatedStyle]}>
			<View style={styles.contentContainer}>
				<View style={styles.textContainer}>
					<TextBaseB>{t('migrate.scanning')}</TextBaseB>
					<TextBaseB colorName="blue">
						{progress.current} / {progress.total}
					</TextBaseB>
				</View>

				<View style={styles.progressBarContainer}>
					<Animated.View style={[styles.progressBarFill, progressBarAnimatedStyle]} />
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 100,
		left: 16,
		right: 16,
		zIndex: 100,
	},
	contentContainer: {
		backgroundColor: 'rgba(0, 0, 0, 0.85)',
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
	},
	textContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	progressBarContainer: {
		height: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderRadius: 4,
		overflow: 'hidden',
	},
	progressBarFill: {
		position: 'absolute',
		top: 0,
		left: 0,
		height: '100%',
		backgroundColor: accentColors.blue,
		borderRadius: 4,
	},
});

export default memo(MigrationProgressOverlay);
