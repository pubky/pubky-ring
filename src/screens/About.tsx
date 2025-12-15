import React, { memo, ReactElement, useMemo } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import {
	View,
	Text,
	NavButton,
	ArrowLeft,
	ArrowRight,
	CardView,
	ScrollView,
} from '../theme/components.ts';
import PubkyRingHeader from '../components/PubkyRingHeader';
import { version } from '../../package.json';
// @ts-ignore
import PubkyRingLogo from '../images/pubky-app-logo.png';
import { PUBKY_APP_URL, TERMS_OF_USE } from '../utils/constants.ts';
import { shareData, showToast } from '../utils/helpers.ts';
import { copyToClipboard } from '../utils/clipboard.ts';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPubky'>;

const About = ({ navigation }: Props): ReactElement => {
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
	const LeftButton = useMemo(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={navigation.goBack}
			hitSlop={{ top: 20,
				bottom: 20,
				left: 20,
				right: 20 }}
		>
			<ArrowLeft size={24} />
		</NavButton>
	), [navigation]);

	const RightButton = useMemo(() => (
		<NavButton style={styles.rightNavButton} />
	),[]);

	return (
		<View style={styles.container}>
			<PubkyRingHeader
				leftButton={LeftButton}
				rightButton={RightButton}
			/>

			<ScrollView style={styles.content}>
				<Text style={styles.title}>{t('about.keychainFor')}</Text>
				<Text style={styles.lowerTitle}>{t('about.theNextWeb')}</Text>
				<Text style={styles.subtitle}>{t('about.description')}</Text>
				<Text style={styles.subtitle}>{t('about.craftedBy')}</Text>

				<TouchableOpacity activeOpacity={0.8} onPress={onLegalPress} style={styles.row}>
					<Text style={styles.rowTitle}>{t('about.legal')}</Text>
					<ArrowRight />
				</TouchableOpacity>

				<CardView style={styles.divider} />

				<TouchableOpacity activeOpacity={0.8} onPress={onSharePress} style={styles.row}>
					<Text style={styles.rowTitle}>{t('common.share')}</Text>
					<ArrowRight />
				</TouchableOpacity>

				<CardView style={styles.divider} />

				<TouchableOpacity activeOpacity={0.8} onPress={onCopyPress} style={styles.row}>
					<Text style={styles.rowTitle}>{t('about.version')}</Text>
					<Text style={styles.rowTitle}>{version}</Text>
				</TouchableOpacity>

				<CardView style={styles.divider} />

				<TouchableOpacity activeOpacity={0.8} onPress={onFooterPress}>
					<View style={styles.footer}>
						<View style={styles.footerContent}>
							<View style={styles.row}>
								<View style={styles.logo}>
									<Image
										source={PubkyRingLogo}
										style={styles.pubkyLogo}
									/>
									<Text style={styles.footerText}>{t('about.joinWithPubkyRing')}</Text>
								</View>
								<ArrowRight />
							</View>
						</View>
					</View>
				</TouchableOpacity>

			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	title: {
		fontSize: 48,
		fontWeight: 700,
		lineHeight: 48,
		textAlign: 'left',
	},
	lowerTitle: {
		fontSize: 48,
		fontWeight: 700,
		lineHeight: 48,
		textAlign: 'left',
		marginBottom: 16,
	},
	subtitle: {
		fontSize: 17,
		fontWeight: 400,
		lineHeight: 22,
		letterSpacing: 0.4,
		marginBottom: 16,
		opacity: 0.8,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		height: 60,
		backgroundColor: 'transparent',
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
	divider: {
		height: 1,
		width: '100%',
		marginVertical: 5,
	},
	footer: {
		marginTop: 40,
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
		marginBottom: 20,
		marginHorizontal: 24,
		width: '100%',
		backgroundColor: 'rgba(200, 255, 0, 0.1)',
	},
	footerContent: {
		margin: 25,
		backgroundColor: 'transparent',
	},
	footerText: {
		fontSize: 17,
		fontWeight: '600',
		lineHeight: 22,
		letterSpacing: 0.4,
		color: 'rgba(200, 255, 0, 1)',
	},
	pubkyLogo: {
		height: 56,
		resizeMode: 'contain',
		backgroundColor: 'transparent',
	},

	rightNavButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(About);
