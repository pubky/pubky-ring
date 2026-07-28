import React, { memo, ReactElement } from 'react';
import { Image, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SheetScreen } from '../components/Sheet.tsx';
import { Mail, Telegram, XLogo } from '../icons/index.ts';
import { BodyMText, DisplayText } from '../theme/typography';
import { isSmallScreen } from '../utils/helpers.ts';

const SHEET_ID = 'add-pubky';
const CONTACT_LINKS = {
	email: 'mailto:support@synonym.to?subject=Request%20for%20Pubky%20Invite%20Code',
	twitter: 'https://x.com/getpubky',
	telegram: 'https://t.me/pubkychat',
} as const;

const smallScreen = isSmallScreen();

const AddPubkyRequestInvite = (): ReactElement => {
	const { t } = useTranslation();

	return (
		<SheetScreen id={SHEET_ID} title={t('welcome.defaultHomeserver')} gradientType="brand">
			<View style={styles.content}>
				<DisplayText style={styles.headerText}>{t('requestInvite.needInvite')}</DisplayText>
				<BodyMText>{t('requestInvite.askTeam')}</BodyMText>

				<View style={styles.contactOptions}>
					<TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL(CONTACT_LINKS.email)}>
						<Mail colorName="textTertiary" />
					</TouchableOpacity>

					<TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL(CONTACT_LINKS.twitter)}>
						<XLogo colorName="textTertiary" />
					</TouchableOpacity>

					<TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL(CONTACT_LINKS.telegram)}>
						<Telegram colorName="textTertiary" />
					</TouchableOpacity>
				</View>

				<View style={styles.giftContainer}>
					<Image
						source={require('../images/gift.png')}
						style={[styles.giftImage, smallScreen && styles.giftImageSmall]}
						resizeMode="contain"
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
	contactOptions: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
		gap: 24,
	},
	giftContainer: {
		flex: 1,
		alignItems: 'center',
	},
	giftImage: {
		width: 420,
		height: 420,
	},
	giftImageSmall: {
		width: 300,
		height: 300,
	},
});

export default memo(AddPubkyRequestInvite);
