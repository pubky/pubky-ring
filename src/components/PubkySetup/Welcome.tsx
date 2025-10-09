import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
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
	AuthorizeButton,
} from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import ModalIndicator from '../ModalIndicator.tsx';
// @ts-ignore
import PubkyRingLogo from "../../images/pubky-ring.png";
import { PUBKY_APP_URL, WELCOME_GRADIENT } from '../../utils/constants.ts';

const Welcome = ({ payload }: {
	payload: {
		pubky: string;
		onComplete?: () => void;
    isInvite?: boolean;
	};
}): ReactElement => {
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
		<RadialGradient
			style={styles.content}
			colors={WELCOME_GRADIENT}
			center={{ x: 0.5, y: 0.5 }}
		>
			<View style={styles.contentWrapper}>
				<ModalIndicator />
				<View style={styles.titleContainer}>
					<Text style={styles.title}>Default Homeserver</Text>
				</View>

				<Text style={styles.headerText}>Welcome.</Text>
				<View style={styles.messageContainer}>
					<SessionText style={styles.message}>
						Your invite code is valid. Your pubky{' '}
						<Text style={styles.pubkyText}>{truncatedPubky}</Text>
						{' '}is now configured to use the Synonym homeserver for data hosting.
					</SessionText>
				</View>

				<View style={styles.padlockContainer}>
					<Image
						source={require('../../images/welcome-tag.png')}
						style={styles.padlockImage}
						resizeMode="contain"
					/>
				</View>
				<View style={styles.footer}>
					<AuthorizeButton
						style={styles.openButton}
						onPressIn={handleOpenPubkyApp}
					>
						<Text style={styles.buttonText}>Open {PUBKY_APP_URL}</Text>
						<Image
							source={PubkyRingLogo}
							style={styles.pubkyLogo}
						/>
					</AuthorizeButton>
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
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		marginBottom: 16,
		fontWeight: '700',
		backgroundColor: 'transparent',
	},
	messageContainer: {
		marginBottom: 40,
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		backgroundColor: 'transparent',
	},
	pubkyText: {
		fontWeight: '600',
		backgroundColor: 'transparent',

	},
	padlockContainer: {
		alignItems: 'center',
		marginBottom: 40,
		backgroundColor: 'transparent',
	},
	padlockImage: {
		width: 380,
		height: 380,
		bottom: 40
	},
	footer: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'transparent'
	},
	openButton: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		flexDirection: 'row',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.15)',
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		justifyContent: 'space-evenly',
	},
	buttonText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
		letterSpacing: 0.2,
		right: -20
	},
	pubkyLogo: {
		height: 24,
		resizeMode: 'contain',
		backgroundColor: 'transparent',
	},
});

export default memo(Welcome);
