import React, { memo, ReactElement } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import PubkyRingLogo from '../images/pubky-app-logo.png';
import BrandEndoresment from '../images/brand-endorsement.png';
import { PUBKY_APP_URL, TERMS_OF_USE } from '../utils/constants.ts';
import { shareData, showToast } from '../utils/helpers.ts';
import { copyToClipboard } from '../utils/clipboard.ts';
import { useTranslation } from 'react-i18next';
import { BodyMSBText, BodyMSpacedText, BodyMText, DisplayText } from '../theme/typography.ts';
import SafeAreaInset from '../components/SafeAreaInset.tsx';
import { ChevronRight } from '../icons/index.ts';
import { appVersion } from '../utils/appInfo.ts';

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
				<DisplayText>{t('about.keychainFor')}</DisplayText>
				<DisplayText style={styles.lowerTitle}>{t('about.theNextWeb')}</DisplayText>
				<BodyMText style={styles.subtitle}>{t('about.description')}</BodyMText>
				<BodyMText style={styles.subtitle}>{t('about.craftedBy')}</BodyMText>

				<TouchableOpacity activeOpacity={0.8} onPress={onLegalPress} style={styles.row}>
					<BodyMSpacedText>{t('about.legal')}</BodyMSpacedText>
					<ChevronRight colorName="textTertiary" />
				</TouchableOpacity>

				<TouchableOpacity activeOpacity={0.8} onPress={onSharePress} style={styles.row}>
					<BodyMSpacedText>{t('common.share')}</BodyMSpacedText>
					<ChevronRight colorName="textTertiary" />
				</TouchableOpacity>

				<TouchableOpacity activeOpacity={0.8} onPress={onCopyPress} style={styles.row}>
					<BodyMSpacedText>{t('about.version')}</BodyMSpacedText>
					<BodyMSpacedText colorName="textTertiary">{appVersion}</BodyMSpacedText>
				</TouchableOpacity>

				<Image source={BrandEndoresment} style={styles.brandLogo} />

				<TouchableOpacity style={styles.footer} activeOpacity={0.8} onPress={onFooterPress}>
					<View>
						<Image source={PubkyRingLogo} style={styles.pubkyLogo} />
						<BodyMSBText colorName="pubkyApp" style={styles.footerText}>
							{t('about.joinWithPubkyRing')}
						</BodyMSBText>
					</View>
					<ChevronRight colorName="textTertiary" />
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
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 'auto',
		marginHorizontal: 24,
		padding: 24,
		borderRadius: 16,
		alignSelf: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
		width: '100%',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	footerText: {
		letterSpacing: 0,
		marginTop: 12,
	},
	pubkyLogo: {
		height: 36,
		width: 110,
		resizeMode: 'contain',
	},
	brandLogo: {
		height: 24,
		width: 214,
		alignSelf: 'flex-start',
		resizeMode: 'contain',
		marginVertical: 24,
	},
});

export default memo(About);
