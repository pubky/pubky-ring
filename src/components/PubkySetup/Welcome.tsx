import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, Image, Linking, View } from 'react-native';
import PubkyRingLogo from '../../images/pubky-app-logo.png';
import { PUBKY_APP_URL } from '../../utils/constants.ts';
import { isSmallScreen } from '../../utils/helpers.ts';
import { useTranslation } from 'react-i18next';
import { BodyMText, BoldText, DisplayText } from '../../theme/typography';
import Button from '../Button.tsx';

const BUTTON_TEXT = PUBKY_APP_URL.replace('https://', '');
const smallScreen = isSmallScreen();

const Welcome = ({
	payload,
}: {
	payload: {
		pubky: string;
		isInvite?: boolean;
		onComplete: () => void;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const { isInvite, onComplete, pubky } = payload;

	const closeSheet = useCallback((): void => {
		onComplete();
	}, [onComplete]);

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
			closeSheet();
		}, 100);
	}, [appUrl, closeSheet]);

	const truncatedPubky = useMemo(() => {
		if (!pubky) return '';
		if (pubky.length > 20) {
			return `${pubky.substring(0, 7)}...${pubky.substring(pubky.length - 5)}`;
		}
		return pubky;
	}, [pubky]);

	return (
		<View style={styles.content}>
			<DisplayText style={styles.headerText}>{t('welcome.welcome')}</DisplayText>
			<BodyMText style={styles.message}>
				{t('welcome.homeserverMessageStart')} <BoldText>{truncatedPubky}</BoldText>{' '}
				{t('welcome.homeserverMessageEnd')}
			</BodyMText>

			<View style={styles.tagContainer}>
				<Image
					style={[styles.tagImage, smallScreen && styles.tagImageSmall]}
					source={require('../../images/welcome-tag.png')}
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
