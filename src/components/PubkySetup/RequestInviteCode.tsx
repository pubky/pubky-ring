import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, Image, Linking, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, Mail, Send } from '../../theme/components.ts';
import XLogo from '../XLogo.tsx';
import { textStyles } from '../../theme/utils';
import { isSmallScreen } from '../../utils/helpers.ts';

const CONTACT_LINKS = {
	email: 'mailto:support@synonym.to?subject=Request%20for%20Pubky%20Invite%20Code',
	twitter: 'https://x.com/getpubky',
	telegram: 'https://t.me/pubkychat',
} as const;

const smallScreen = isSmallScreen();

const RequestInviteCode = (): ReactElement => {
	const { t } = useTranslation();

	const handleEmailContact = useCallback(() => {
		Linking.openURL(CONTACT_LINKS.email);
	}, []);

	const handleTwitterContact = useCallback(() => {
		Linking.openURL(CONTACT_LINKS.twitter);
	}, []);

	const handleTelegramContact = useCallback(() => {
		Linking.openURL(CONTACT_LINKS.telegram);
	}, []);

	return (
		<View style={styles.content}>
			<Text style={styles.headerText}>{t('requestInvite.needInvite')}</Text>
			<Text style={styles.message}>{t('requestInvite.askTeam')}</Text>

			<View style={styles.contactOptions}>
				<TouchableOpacity style={styles.contactButton} onPress={handleEmailContact} activeOpacity={0.7}>
					<Mail color="rgba(255, 255, 255, 0.8)" size={24} />
				</TouchableOpacity>

				<TouchableOpacity style={styles.contactButton} onPress={handleTwitterContact} activeOpacity={0.7}>
					<XLogo color="rgba(255, 255, 255, 0.8)" size={24} />
				</TouchableOpacity>

				<TouchableOpacity style={styles.contactButton} onPress={handleTelegramContact} activeOpacity={0.7}>
					<Send color="rgba(255, 255, 255, 0.8)" size={24} />
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
		...textStyles.display,
		marginBottom: 20,
	},
	message: {
		...textStyles.bodyM,
		color: 'rgba(255, 255, 255, 0.8)',
	},
	contactOptions: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
	},
	contactButton: {
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
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
