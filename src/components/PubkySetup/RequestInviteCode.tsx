import React, { memo, ReactElement } from 'react';
import { StyleSheet, Image, Linking, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BodyMText, DisplayText } from '../../theme/typography';
import { isSmallScreen } from '../../utils/helpers.ts';
import { Mail, Telegram, XLogo } from '../../icons/index.ts';

const CONTACT_LINKS = {
	email: 'mailto:support@synonym.to?subject=Request%20for%20Pubky%20Invite%20Code',
	twitter: 'https://x.com/getpubky',
	telegram: 'https://t.me/pubkychat',
} as const;

const smallScreen = isSmallScreen();

const RequestInviteCode = (): ReactElement => {
	const { t } = useTranslation();

	return (
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
					source={require('../../images/gift.png')}
					style={[styles.giftImage, smallScreen && styles.giftImageSmall]}
					resizeMode="contain"
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

export default memo(RequestInviteCode);
