import React, { memo, useCallback } from 'react';
import { Image, Linking, StyleSheet } from 'react-native';
import { View, Text, ScrollView, RadialGradient } from '../theme/components.ts';
import LinearGradient from 'react-native-linear-gradient';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import { ACCENTS, BLUE_RADIAL_GRADIENT, TERMS_OF_USE } from '../utils/constants.ts';
import { useDispatch, useSelector } from 'react-redux';
import { updateSignedTermsOfUse } from '../store/slices/settingsSlice.ts';
import { getHasPubkys } from '../store/selectors/pubkySelectors.ts';
import { getShowOnboarding } from '../store/selectors/settingsSelectors.ts';
import { useTypedNavigation } from '../navigation/hooks';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button.tsx';
import TermsOfUseContent from '../components/TermsOfUseContent.tsx';
import SafeAreaInset from '../components/SafeAreaInset.tsx';
import { textStyles } from '../theme/utils';

const TermsOfUse = (): React.ReactElement => {
	const { t } = useTranslation();
	const navigation = useTypedNavigation();
	const dispatch = useDispatch();
	const _hasPubkys = useSelector(getHasPubkys);
	const showOnboarding = useSelector(getShowOnboarding);

	const onContinue = useCallback(() => {
		dispatch(updateSignedTermsOfUse({ signedTermsOfUse: true }));
		navigation.replace(showOnboarding ? 'Onboarding' : _hasPubkys ? 'Home' : 'Onboarding');
	}, [_hasPubkys, dispatch, navigation, showOnboarding]);

	const onPrivacyFormPress = (): void => {
		try {
			Linking.openURL(TERMS_OF_USE);
		} catch {}
	};

	return (
		<View style={styles.container}>
			<AppHeader disableBackNavigation />

			<RadialGradient style={styles.background} colors={BLUE_RADIAL_GRADIENT} center={{ x: 1, y: 0.5 }}>
				<Image source={require('../images/circles.png')} style={styles.backgroundImage} />
			</RadialGradient>

			<View style={styles.contentContainer}>
				<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
					<View style={styles.textContainer}>
						<TermsOfUseContent />
					</View>
				</ScrollView>

				<View style={styles.footer}>
					<LinearGradient
						style={styles.fadeOverlay}
						colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']}
						start={{ x: 0, y: 0 }}
						end={{ x: 0, y: 1 }}
						pointerEvents="none"
					/>

					<View style={styles.footerItem}>
						<Text style={styles.footerHeaderText}>{t('terms.termsOfUse')}</Text>
						<Text style={styles.footerText}>{t('terms.acceptTerms')}</Text>
					</View>

					<View style={styles.divider} />

					<View style={styles.footerItem}>
						<Text style={styles.footerHeaderText}>{t('terms.privacyPolicy')}</Text>
						<Text style={styles.footerText}>
							{t('terms.acceptPrivacy')}
							<Text style={styles.linkText} onPress={onPrivacyFormPress}>
								{t('terms.privacyPolicy')}
							</Text>
							.
						</Text>
					</View>

					<Button
						style={styles.button}
						text={t('common.continue')}
						size="large"
						testID="TermsContinueButton"
						onPress={onContinue}
					/>

					<SafeAreaInset edge="bottom" />
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		position: 'relative',
		backgroundColor: 'transparent',
	},
	scrollView: {
		flex: 1,
		backgroundColor: 'transparent',
		paddingHorizontal: 24,
	},
	textContainer: {
		paddingTop: HEADER_HEIGHT + 16,
		paddingBottom: 320, // Extra space to allow scrolling past the footer
		backgroundColor: 'transparent',
	},
	background: {
		...StyleSheet.absoluteFill,
	},
	backgroundImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	fadeOverlay: {
		position: 'absolute',
		top: -150,
		left: 0,
		right: 0,
		height: 150,
		zIndex: 1, // Ensure gradient appears above content
	},
	footer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 24,
		zIndex: 2, // Ensure footer appears above the fade overlay
		backgroundColor: '#000000',
	},
	footerHeaderText: {
		...textStyles.bodyMSB,
		color: 'white',
		marginBottom: 2,
	},
	footerText: {
		...textStyles.bodySSB,
		color: '#a3a3a3',
	},
	linkText: {
		color: ACCENTS.pubkyRing,
		textTransform: 'lowercase',
	},
	footerItem: {
		backgroundColor: 'transparent',
	},
	divider: {
		marginVertical: 12,
		height: 1,
		width: '100%',
		backgroundColor: '#2a2a2a',
	},
	button: {
		marginTop: 24,
	},
});

export default memo(TermsOfUse);
