import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, Image, Linking, Platform } from 'react-native';
import { View, Text, SessionText, RadialGradient } from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import ModalIndicator from '../ModalIndicator.tsx';
// @ts-ignore
import PubkyRingLogo from '../../images/pubky-app-logo.png';
import { PUBKY_APP_URL, WELCOME_GRADIENT } from '../../utils/constants.ts';
import { isSmallScreen } from '../../utils/helpers.ts';
import { useTranslation } from 'react-i18next';
import { textStyles } from '../../theme/utils';
import Button from '../Button.tsx';

const BUTTON_TEXT = PUBKY_APP_URL.replace('https://', '');

const Welcome = ({
	payload,
}: {
	payload: {
		pubky: string;
		onComplete?: () => void;
		isInvite?: boolean;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const smallScreen = useMemo(() => isSmallScreen(), []);

	const dynamicStyles = useMemo(
		() =>
			StyleSheet.create({
				// eslint-disable-next-line react-native/no-unused-styles
				messageContainer: {
					marginBottom: smallScreen ? 20 : 40,
					backgroundColor: 'transparent',
				},
				// eslint-disable-next-line react-native/no-unused-styles
				tagImage: {
					width: smallScreen ? 280 : 380,
					height: smallScreen ? 280 : 380,
					bottom: smallScreen ? 10 : 40,
				},
			}),
		[smallScreen],
	);

	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('new-pubky-setup');
	}, []);

	const appUrl = useMemo(() => {
		if (payload?.isInvite) {
			return `${PUBKY_APP_URL}/sign-in`;
		}
		return PUBKY_APP_URL;
	}, [payload?.isInvite]);

	const handleOpenPubkyApp = useCallback(() => {
		// Open pubky.app or the app store if not installed
		Linking.openURL(appUrl);
		setTimeout(() => {
			closeSheet();
		}, 100);
	}, [appUrl, closeSheet]);

	const truncatedPubky = useMemo(() => {
		if (!payload.pubky) return '';
		if (payload.pubky.length > 20) {
			return `${payload.pubky.substring(0, 7)}...${payload.pubky.substring(payload.pubky.length - 5)}`;
		}
		return payload.pubky;
	}, [payload.pubky]);

	return (
		<RadialGradient style={styles.content} colors={WELCOME_GRADIENT} center={{ x: 0.5, y: 0.5 }}>
			<View style={styles.contentWrapper}>
				<ModalIndicator />
				<View style={styles.titleContainer}>
					<Text style={styles.title}>{t('welcome.defaultHomeserver')}</Text>
				</View>

				<Text style={styles.headerText}>{t('welcome.welcome')}</Text>
				<View style={dynamicStyles.messageContainer}>
					<SessionText style={styles.message}>
						{t('welcome.homeserverMessageStart')} <Text style={styles.pubkyText}>{truncatedPubky}</Text>{' '}
						{t('welcome.homeserverMessageEnd')}
					</SessionText>
				</View>

				<View style={styles.tagContainer}>
					<Image
						source={require('../../images/welcome-tag.png')}
						style={dynamicStyles.tagImage}
						resizeMode="contain"
					/>
				</View>
				<View style={styles.footer}>
					<Button
						text={t('welcome.openButton', { domain: BUTTON_TEXT })}
						size="large"
						variant="secondary"
						rightIcon={<Image source={PubkyRingLogo} style={styles.pubkyLogo} />}
						onPress={handleOpenPubkyApp}
					/>
				</View>
			</View>
		</RadialGradient>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		paddingBottom: 20,
	},
	contentWrapper: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	title: {
		...textStyles.bodyMB,
		textAlign: 'center',
		backgroundColor: 'transparent',
	},
	headerText: {
		...textStyles.display,
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	message: {
		...textStyles.bodyM,
		backgroundColor: 'transparent',
	},
	pubkyText: {
		...textStyles.bodyMSB,
		backgroundColor: 'transparent',
	},
	tagContainer: {
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	footer: {
		backgroundColor: 'transparent',
		marginTop: 'auto',
		marginBottom: Platform.select({ ios: 12, android: 32 }),
	},
	pubkyLogo: {
		height: 22,
		width: 66,
		marginLeft: 24,
	},
});

export default memo(Welcome);
