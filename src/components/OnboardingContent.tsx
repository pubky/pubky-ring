import React, { ReactElement, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { RadialGradient } from '../theme/components.ts';
import { BLUE_RADIAL_GRADIENT } from '../utils/constants.ts';
import { updateShowOnboarding } from '../store/slices/settingsSlice.ts';
import { useDispatch } from 'react-redux';
import { textStyles } from '../theme/utils';
import { useTypedNavigation } from '../navigation/hooks';
import { useTranslation } from 'react-i18next';
import Button from './Button.tsx';
import AppHeader from './AppHeader.tsx';

const OnboardingContent = (): ReactElement => {
	const { t } = useTranslation();
	const navigation = useTypedNavigation();
	const dispatch = useDispatch();

	const navigateHome = useCallback(() => {
		dispatch(updateShowOnboarding({ showOnboarding: false }));
		navigation.replace('Home');
	}, [dispatch, navigation]);

	return (
		<View style={styles.container}>
			<AppHeader disableBackNavigation />

			<RadialGradient style={styles.background} colors={BLUE_RADIAL_GRADIENT} center={{ x: 1, y: 0.5 }}>
				{/* Background image */}
				<Image source={require('../images/circles.png')} style={styles.backgroundImage} />
			</RadialGradient>

			{/* Keys Image */}
			<View style={styles.keysImageContainer}>
				<Image source={require('../images/keyring.png')} style={styles.keysImage} />
			</View>

			{/* Content Block: Text and Buttons */}
			<View style={[styles.contentBlock]}>
				{/* Text */}
				<Text style={styles.title}>{t('onboarding.title')}</Text>
				<Text style={styles.subtitle}>{t('about.description')}</Text>

				{/* Buttons */}
				<View style={styles.buttonContainer}>
					<Button
						testID="OnboardingGetStartedButton"
						style={styles.buttonPrimary}
						text={t('onboarding.getStarted')}
						size="large"
						onPress={navigateHome}
					/>
				</View>
			</View>
		</View>
	);
};

// Move your existing styles here
const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	background: {
		...StyleSheet.absoluteFill,
	},
	backgroundImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	logoContainer: {
		position: 'absolute',
		top: 24,
		left: 0,
		right: 0,
		alignItems: 'center',
	},
	logo: {
		width: 171,
		height: 36,
		resizeMode: 'contain',
	},
	keysImageContainer: {
		position: 'absolute',
		top: 90,
		left: 0,
		right: 30,
		alignItems: 'center',
	},
	keysImage: {
		width: 443,
		height: 443,
		resizeMode: 'contain',
	},
	contentBlock: {
		flex: 1,
		justifyContent: 'flex-end',
		paddingHorizontal: 24,
	},
	title: {
		...textStyles.display,
	},
	subtitle: {
		...textStyles.bodyM,
		marginTop: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 24,
	},
	buttonPrimary: {
		flex: 1,
	},
});

export default OnboardingContent;
