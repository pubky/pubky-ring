import React, { memo, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	withSpring,
	Easing,
	interpolate,
} from 'react-native-reanimated';
import { View, Text } from '../theme/components';
import {
	subscribeMigrationProgress,
	MigrationProgress,
} from '../utils/actions/migrateAction';
import { useTranslation } from 'react-i18next';

const MigrationProgressOverlay = (): React.ReactElement | null => {
	const { t } = useTranslation();
	const [progress, setProgress] = useState<MigrationProgress>({
		current: 0,
		total: 0,
		isActive: false,
		isImporting: false,
	});

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
		containerOpacity.value = withTiming(shouldShow ? 1 : 0, {
			duration: 300,
			easing: Easing.ease,
		});
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
				translateY: interpolate(
					containerOpacity.value,
					[0, 1],
					[-20, 0]
				),
			},
		],
	}));

	const progressBarAnimatedStyle = useAnimatedStyle(() => ({
		width: `${progressWidth.value}%`,
	}));

	// Don't render if not active
	if (!progress.isActive && !progress.isImporting && containerOpacity.value === 0) {
		return null;
	}

	return (
		<Animated.View style={[styles.container, containerAnimatedStyle]}>
			<View style={styles.contentContainer}>
				<View style={styles.textContainer}>
					<Text style={styles.title}>
						{t('migrate.scanning')}
					</Text>
					<Text style={styles.progressText}>
						{progress.current} / {progress.total}
					</Text>
				</View>

				<View style={styles.progressBarContainer}>
					<Animated.View
						style={[styles.progressBarFill, progressBarAnimatedStyle]}
					/>
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
	title: {
		fontSize: 15,
		fontWeight: '600',
		color: 'rgba(255, 255, 255, 0.9)',
		letterSpacing: 0.3,
	},
	progressText: {
		fontSize: 17,
		fontWeight: '700',
		color: '#0085FF',
		letterSpacing: 0.5,
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
		backgroundColor: '#0085FF',
		borderRadius: 4,
	},
});

export default memo(MigrationProgressOverlay);
