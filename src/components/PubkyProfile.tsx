import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { copyToClipboard } from '../utils/clipboard';
import { PubkyData } from '../navigation/types';
import {
	View,
	Text,
	ActionButton,
	ActivityIndicator,
	Card,
	AuthorizeButton,
} from '../theme/components';
import { isSmallScreen, showToast } from '../utils/helpers';
import ProfileAvatar from './ProfileAvatar';

interface PubkyProfileProps {
    index?: number;
    pubky: string;
    pubkyData: PubkyData;
    onButtonPress?: () => void;
    hideButton?: boolean;
    buttonText?: string;
    buttonIcon?: React.ReactNode;
    isButtonLoading?: boolean;
}

export const PubkyProfile = memo(({
	index,
	pubky,
	pubkyData,
	onButtonPress,
	hideButton = false,
	buttonText,
	buttonIcon,
	isButtonLoading = false,
}: PubkyProfileProps) => {

	const handleCopyPubky = useCallback(() => {
		copyToClipboard(pubky);
		showToast({
			type: 'info',
			title: 'Pubky copied',
			description: 'Your Pubky has been copied to the clipboard',
		});
	}, [pubky]);


	const pubkyUri = useMemo(() => pubky.startsWith('pk:') ? pubky : `pk:${pubky}`, [pubky]);

	const pubkyName = useMemo(() => {
		if (pubkyData?.name) {
			return pubkyData.name;
		}
		if (index !== undefined) {
			return `pubky #${index + 1}`;
		}
		return 'pubky';
	}, [index, pubkyData.name]);

	const smallScreenStyle = useMemo(() => {
		const smallScreen = isSmallScreen();
		return smallScreen ? { padding: 15 } : {};
	}, []);

	return (
		<View style={[styles.profileContainer, smallScreenStyle]}>
			<Card style={styles.profile}>
				<View style={styles.avatarContainer}>
					<ProfileAvatar pubky={pubky} size={86} />
				</View>

				<Text style={styles.nameText}>{pubkyName}</Text>

				<ActionButton style={styles.pubkyButton} onPress={handleCopyPubky} activeOpacity={0.7}>
					<Text style={styles.pubkyText}>{pubkyUri}</Text>
				</ActionButton>
			</Card>
			{!hideButton && (
				<AuthorizeButton
					style={styles.authorizeButton}
					onPressIn={onButtonPress}
				>
					<View style={styles.row}>
						{isButtonLoading ? (<ActivityIndicator size="small" />) : (
							<>
								{buttonIcon}
								{buttonText && <Text style={styles.buttonText}>{buttonText}</Text>}
							</>
                        )}
					</View>
				</AuthorizeButton>
			)}
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		borderRadius: 16,
	},
	profileContainer: {
		alignItems: 'center',
		borderRadius: 16,
		padding: 36,
		backgroundColor: 'transparent',
	},
	profile: {
		alignItems: 'center',
		width: '100%',
		backgroundColor: 'transparent',
		paddingBottom: 16,
	},
	authorizeButton: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 20,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
		borderWidth: 1,
		alignSelf: 'center',
		alignContent: 'center',
		justifyContent: 'center',
	},
	row: {
		flex: 1,
		backgroundColor: 'transparent',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		marginLeft: 5,
	},
	avatarContainer: {
		width: 96,
		height: 96,
		borderRadius: 60,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
		marginBottom: 8,
	},
	nameText: {
		fontSize: 26,
		fontWeight: '300',
		letterSpacing: 0,
		lineHeight: 26,
		marginBottom: 8,
		textAlign: 'center',
		backgroundColor: 'transparent',
	},
	pubkyText: {
		fontSize: 17,
		fontFamily: 'monospace',
		textAlign: 'center',
		marginBottom: 8,
		fontWeight: '600',
		lineHeight: 22,
		letterSpacing: 0.4,
	},
	pubkyButton: {
		backgroundColor: 'transparent',
	},
});

export default PubkyProfile;
