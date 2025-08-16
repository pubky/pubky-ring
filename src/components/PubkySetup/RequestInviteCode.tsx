import React, {
	memo,
	ReactElement,
	useCallback,
} from 'react';
import {
	StyleSheet,
	Image,
	Linking,
} from 'react-native';
import {
	View,
	Text,
	SessionText,
	RadialGradient,
	TouchableOpacity,
} from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import ModalIndicator from '../ModalIndicator.tsx';
import { ArrowLeft, Mail, Send } from 'lucide-react-native';
import XLogo from '../XLogo.tsx';
import { INVITE_CODE_GRADIENT } from '../../utils/constants.ts';

const RequestInviteCode = ({ payload }: {
	payload: {
		onBack?: () => void;
	};
}): ReactElement => {
	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('new-pubky-setup');
	}, []);

	const handleBack = useCallback(() => {
		if (payload?.onBack) {
			payload.onBack();
		} else {
			closeSheet();
		}
	}, [closeSheet, payload]);

	const handleEmailContact = useCallback(() => {
		Linking.openURL('mailto:support@synonym.to?subject=Request%20for%20Pubky%20Invite%20Code');
	}, []);

	const handleTwitterContact = useCallback(() => {
		Linking.openURL('https://x.com/getpubky');
	}, []);

	const handleTelegramContact = useCallback(() => {
		Linking.openURL('https://t.me/pubkychat');
	}, []);

	return (
		<RadialGradient
			style={styles.content}
			colors={INVITE_CODE_GRADIENT}
			center={{ x: 0.5, y: 0.3 }}
		>
			<ModalIndicator />
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={handleBack}
					activeOpacity={0.7}
				>
					<ArrowLeft color="#FFFFFF" size={24} />
				</TouchableOpacity>
				<Text style={styles.title}>Default Homeserver</Text>
				<View style={styles.placeholder} />
			</View>

			<Text style={styles.headerText}>Do you need an invite?</Text>
			<SessionText style={styles.message}>
				Ask the Pubky team for your invite code to access the Synonym homeserver.
			</SessionText>

			<View style={styles.contactOptions}>
				<TouchableOpacity
					style={styles.contactButton}
					onPress={handleEmailContact}
					activeOpacity={0.7}
				>
					<Mail color="rgba(255, 255, 255, 0.8)" size={24} />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.contactButton}
					onPress={handleTwitterContact}
					activeOpacity={0.7}
				>
					<XLogo color="rgba(255, 255, 255, 0.8)" size={24} />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.contactButton}
					onPress={handleTelegramContact}
					activeOpacity={0.7}
				>
					<Send color="rgba(255, 255, 255, 0.8)" size={24} />
				</TouchableOpacity>
			</View>

			<View style={styles.spacer} />

			<View style={styles.giftContainer}>
				<Image
					source={require('../../images/gift.png')}
					style={styles.giftImage}
					resizeMode="contain"
				/>
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
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
		backgroundColor: 'transparent',
		top: -10
	},
	backButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	placeholder: {
		width: 44,
		height: 44,
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 56,
		marginBottom: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 24,
		marginBottom: 40,
		color: '#FFFFFF',
		backgroundColor: 'transparent',
	},
	contactOptions: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		gap: 24,
		marginBottom: 20,
		backgroundColor: 'transparent',
	},
	contactButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	spacer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	giftContainer: {
		alignItems: 'center',
		backgroundColor: 'transparent',
		paddingBottom: 40,
	},
	giftImage: {
		width: 420,
		height: 420,
		bottom: 40
	},
});

export default memo(RequestInviteCode);
