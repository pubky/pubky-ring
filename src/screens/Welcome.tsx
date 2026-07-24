import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, Image, Linking, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Trans, useTranslation } from 'react-i18next';
import PubkyRingLogo from '../images/pubky-app-logo.png';
import { PUBKY_APP_URL } from '../utils/constants.ts';
import { isSmallScreen } from '../utils/helpers.ts';
import { BodyMBText, BodyMText, DisplayText } from '../theme/typography';
import Button from '../components/Button.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { hideSheet } from '../sheets/sheetNavigation.tsx';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';
const BUTTON_TEXT = PUBKY_APP_URL.replace('https://', '');
const smallScreen = isSmallScreen();

const Welcome = ({ route }: NativeStackScreenProps<AddPubkyStackParamList, 'Welcome'>): ReactElement => {
	const { t } = useTranslation();
	const { isInvite, pubky } = route.params;

	const appUrl = useMemo(() => {
		if (isInvite) {
			return `${PUBKY_APP_URL}/sign-in`;
		}
		return PUBKY_APP_URL;
	}, [isInvite]);

	const handleOpenPubkyApp = useCallback(() => {
		// Open pubky.app or the app store if not installed
		Linking.openURL(appUrl);
		setTimeout(() => {
			hideSheet(SHEET_ID);
		}, 100);
	}, [appUrl]);

	const truncatedPubky = useMemo(() => {
		if (!pubky) return '';
		if (pubky.length > 20) {
			return `${pubky.substring(0, 7)}...${pubky.substring(pubky.length - 5)}`;
		}
		return pubky;
	}, [pubky]);

	return (
		<SheetScreen id={SHEET_ID} title={t('welcome.defaultHomeserver')} gradientType="brand">
			<View style={styles.content}>
				<DisplayText style={styles.headerText}>{t('welcome.welcome')}</DisplayText>

				<BodyMText style={styles.message}>
					<Trans
						t={t}
						i18nKey="welcome.message"
						components={{ accent: <BodyMBText colorName="textPrimary" /> }}
						values={{ pubky: truncatedPubky }}
					/>
				</BodyMText>

				<View style={styles.tagContainer}>
					<Image
						style={[styles.tagImage, smallScreen && styles.tagImageSmall]}
						source={require('../images/welcome-tag.png')}
						resizeMode="contain"
					/>
				</View>

				<View style={styles.footer}>
					<Button
						style={styles.button}
						text={t('welcome.openButton', { domain: BUTTON_TEXT })}
						size="large"
						variant="secondary"
						rightIcon={<Image source={PubkyRingLogo} style={styles.pubkyLogo} />}
						onPress={handleOpenPubkyApp}
					/>
				</View>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	headerText: {
		marginBottom: 20,
	},
	message: {
		marginBottom: 24,
	},
	tagContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
	},
	footer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 'auto',
	},
	button: {
		borderColor: '#ffffff',
	},
	tagImage: {
		width: 380,
		height: 380,
	},
	tagImageSmall: {
		width: 280,
		height: 280,
	},
	pubkyLogo: {
		height: 22,
		width: 66,
		marginLeft: 24,
	},
});

export default memo(Welcome);
