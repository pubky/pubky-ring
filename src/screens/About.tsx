import React, { memo, ReactElement } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { showToast } from '@synonymdev/react-native-toast';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import PubkyRingLogo from '../images/pubky-app-logo.png';
import BrandEndorsement from '../images/brand-endorsement.png';
import { PUBKY_APP_URL, TERMS_OF_USE } from '../utils/constants.ts';
import { shareData } from '../utils/helpers.ts';
import { copyToClipboard } from '../utils/clipboard.ts';
import { useTranslation } from 'react-i18next';
import { Text5Xl, TextBaseB, TextBaseM } from '../theme/typography.ts';
import SafeAreaInset from '../components/SafeAreaInset.tsx';
import { ChevronRight } from '../icons/index.ts';
import { appVersion } from '../utils/appInfo.ts';
import Card from '../components/Card.tsx';

const About = (): ReactElement => {
	const { t } = useTranslation();

	const onFooterPress = (): void => {
		try {
			Linking.openURL(PUBKY_APP_URL).then();
		} catch {
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('about.unableToOpenUrl'),
			});
		}
	};

	const onSharePress = (): void => {
		shareData(PUBKY_APP_URL).then();
	};

	const onLegalPress = (): void => {
		try {
			Linking.openURL(TERMS_OF_USE).then();
		} catch {}
	};

	const onCopyPress = (): void => {
		copyToClipboard(appVersion);
		showToast({
			type: 'info',
			title: t('about.copiedVersion'),
			description: `${t('about.version')}: ${appVersion}`,
		});
	};
	return (
		<View style={styles.container}>
			<AppHeader />

			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<Text5Xl>{t('about.keychainFor')}</Text5Xl>
				<Text5Xl style={styles.lowerTitle}>{t('about.theNextWeb')}</Text5Xl>
				<TextBaseM style={styles.subtitle}>{t('about.description')}</TextBaseM>
				<TextBaseM style={styles.subtitle}>{t('about.craftedBy')}</TextBaseM>

				<TouchableOpacity activeOpacity={0.8} onPress={onLegalPress} style={styles.row}>
					<TextBaseM colorName="foreground">{t('about.legal')}</TextBaseM>
					<ChevronRight colorName="foreground" />
				</TouchableOpacity>

				<TouchableOpacity activeOpacity={0.8} onPress={onSharePress} style={styles.row}>
					<TextBaseM colorName="foreground">{t('common.share')}</TextBaseM>
					<ChevronRight colorName="foreground" />
				</TouchableOpacity>

				<TouchableOpacity activeOpacity={0.8} onPress={onCopyPress} style={styles.row}>
					<TextBaseM colorName="foreground">{t('about.version')}</TextBaseM>
					<TextBaseM colorName="mutedForeground">{appVersion}</TextBaseM>
				</TouchableOpacity>

				<Image source={BrandEndorsement} style={styles.brandLogo} />

				<TouchableOpacity style={styles.pubkyBannerTouchable} activeOpacity={0.8} onPress={onFooterPress}>
					<Card style={styles.pubkyBanner}>
						<View>
							<Image source={PubkyRingLogo} style={styles.pubkyLogo} />
							<TextBaseB style={styles.footerText} colorName="pubkyApp">
								{t('about.joinWithPubkyRing')}
							</TextBaseB>
						</View>
						<ChevronRight colorName="foreground" />
					</Card>
				</TouchableOpacity>

				<SafeAreaInset edge="bottom" />
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 24,
	},
	scrollContent: {
		flexGrow: 1,
		paddingTop: HEADER_HEIGHT + 24,
	},
	lowerTitle: {
		marginBottom: 8,
	},
	subtitle: {
		marginBottom: 24,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 51,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	brandLogo: {
		height: 24,
		width: 214,
		alignSelf: 'flex-start',
		resizeMode: 'contain',
		marginTop: 24,
	},
	pubkyBannerTouchable: {
		marginTop: 40,
		alignSelf: 'center',
		width: '100%',
	},
	pubkyBanner: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	footerText: {},
	pubkyLogo: {
		height: 36,
		width: 110,
		resizeMode: 'contain',
	},
});

export default memo(About);
