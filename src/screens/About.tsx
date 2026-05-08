import React, { memo, ReactElement } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity } from 'react-native';
import { View, Text, ArrowRight, ScrollView } from '../theme/components.ts';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import { version } from '../../package.json';
// @ts-ignore
import PubkyRingLogo from '../images/pubky-app-logo.png';
import BrandEndoresment from '../images/brand-endorsement.png';
import { ACCENTS, PUBKY_APP_URL, TERMS_OF_USE } from '../utils/constants.ts';
import { shareData, showToast } from '../utils/helpers.ts';
import { copyToClipboard } from '../utils/clipboard.ts';
import { useTranslation } from 'react-i18next';
import { textStyles } from '../theme/utils.ts';
import SafeAreaInset from '../components/SafeAreaInset.tsx';

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
		copyToClipboard(version);
		showToast({
			type: 'info',
			title: t('about.copiedVersion'),
			description: `${t('about.version')}: ${version}`,
		});
	};
	return (
		<View style={styles.container}>
			<AppHeader />

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<Text style={styles.title}>{t('about.keychainFor')}</Text>
				<Text style={styles.lowerTitle}>{t('about.theNextWeb')}</Text>
				<Text style={styles.subtitle}>{t('about.description')}</Text>
				<Text style={styles.subtitle}>{t('about.craftedBy')}</Text>

				<TouchableOpacity
					activeOpacity={0.8}
					onPress={onLegalPress}
					style={styles.row}
				>
					<Text style={styles.rowTitle}>{t('about.legal')}</Text>
					<ArrowRight />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.8}
					onPress={onSharePress}
					style={styles.row}
				>
					<Text style={styles.rowTitle}>{t('common.share')}</Text>
					<ArrowRight />
				</TouchableOpacity>

				<TouchableOpacity
					activeOpacity={0.8}
					onPress={onCopyPress}
					style={styles.row}
				>
					<Text style={styles.rowTitle}>{t('about.version')}</Text>
					<Text style={styles.rowValue}>{version}</Text>
				</TouchableOpacity>

				<Image source={BrandEndoresment} style={styles.brandLogo} />

				<TouchableOpacity
					style={styles.footer}
					activeOpacity={0.8}
					onPress={onFooterPress}
				>
					<View style={styles.logo}>
						<Image source={PubkyRingLogo} style={styles.pubkyLogo} />
						<Text style={styles.footerText}>
							{t('about.joinWithPubkyRing')}
						</Text>
					</View>
					<ArrowRight />
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
		backgroundColor: 'transparent',
	},
	title: {
		...textStyles.display,
	},
	lowerTitle: {
		...textStyles.display,
		marginBottom: 8,
	},
	subtitle: {
		...textStyles.bodyM,
		marginBottom: 24,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		height: 51,
		backgroundColor: 'transparent',
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	logo: {
		backgroundColor: 'transparent',
	},
	rowTitle: {
		fontSize: 17,
		fontWeight: 400,
		lineHeight: 22,
		letterSpacing: 0.4,
	},
	rowValue: {
		fontSize: 17,
		fontWeight: 400,
		lineHeight: 22,
		letterSpacing: 0.4,
		color: 'rgba(255, 255, 255, 0.5)',
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
		fontSize: 17,
		fontWeight: '600',
		lineHeight: 22,
		color: ACCENTS.pubkyApp,
		marginTop: 12,
	},
	pubkyLogo: {
		height: 36,
		width: 110,
		resizeMode: 'contain',
		backgroundColor: 'transparent',
	},
	brandLogo: {
		height: 24,
		width: 214,
		alignSelf: 'flex-start',
		resizeMode: 'contain',
		backgroundColor: 'transparent',
		marginVertical: 24,
	},
});

export default memo(About);
