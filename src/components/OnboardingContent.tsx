import React, { ReactElement, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
} from 'react-native';
import { RadialGradient } from '../theme/components.ts';
import { BLUE_RADIAL_GRADIENT } from '../utils/constants.ts';
import { updateShowOnboarding } from '../store/slices/settingsSlice.ts';
import { useDispatch } from 'react-redux';
import { buttonStyles } from '../theme/utils';
import { useTypedNavigation } from '../navigation/hooks';
import { useTranslation } from 'react-i18next';

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
			<RadialGradient
				style={styles.onboardingGradient}
				colors={BLUE_RADIAL_GRADIENT}
				center={{ x: 1, y: 0.5 }}
			>
				{/* Background image */}
				<Image
					source={require('../images/circle.png')}
					style={styles.backgroundImage}
				/>

				{/* Logo */}
				<View style={styles.logoContainer}>
					<Image
						source={require('../images/pubky-ring-logo.png')}
						style={styles.logo}
					/>
				</View>

				{/* Keys Image */}
				<View style={styles.keysImageContainer}>
					<Image
						source={require('../images/keyring.png')}
						style={styles.keysImage}
					/>
				</View>

				{/* Content Block: Text and Buttons */}
				<View style={styles.contentBlock}>
					{/* Text */}
					<View style={styles.textContainer}>
						<Text style={styles.title}>{t('onboarding.title')}</Text>
						<Text style={styles.subtitle}>
							{t('about.description')}
						</Text>
					</View>

					{/* Buttons */}
					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={styles.buttonPrimary}
							onPress={navigateHome}
							testID="OnboardingGetStartedButton"
						>
							<Text
								style={styles.buttonText}
								numberOfLines={1}
								adjustsFontSizeToFit
								minimumFontScale={0.8}
							>{t('onboarding.getStarted')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</RadialGradient>
		</View>
	);
};

// Move your existing styles here
const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	backgroundImage: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 150,
		right: 0,
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	logoContainer: {
		position: 'absolute',
		top: 40,
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
		paddingBottom: 35,
		width: '100%',
	},
	textContainer: {
		paddingHorizontal: 32,
	},
	title: {
		color: 'white',
		fontSize: 48,
		fontWeight: 700,
		lineHeight: 48,
		fontFamily: 'InterTight-VariableFont_wght',
	},
	subtitle: {
		color: 'rgba(255, 255, 255, 0.80)',
		fontSize: 17,
		fontWeight: 400,
		lineHeight: 22,
		letterSpacing: 0.4,
		fontFamily: 'InterTight-VariableFont_wght',
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 20,
		justifyContent: 'space-between',
		width: '100%',
		gap: 12,
		paddingHorizontal: 32,
	},
	buttonPrimary: {
		...buttonStyles.primaryOutline,
		flex: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		minHeight: 64,
	},
	buttonText: {
		color: 'white',
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		fontFamily: 'InterTight-VariableFont_wght',
	},
	onboardingGradient: {
		height: '100%',
	},
});

export default OnboardingContent;
