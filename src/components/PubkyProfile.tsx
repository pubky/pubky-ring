import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { copyToClipboard } from '../utils/clipboard';
import { PubkyData } from '../navigation/types';
import { View, Text, Card } from '../theme/components';
import { isSmallScreen, showToast } from '../utils/helpers';
import ProfileAvatar from './ProfileAvatar';
import i18n from '../i18n';
import { textStyles } from '../theme/utils';
import Button from './Button.tsx';

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

const smallScreen = isSmallScreen();
const smallScreenStyle = smallScreen ? { padding: 15 } : {};

export const PubkyProfile = memo(
	({
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
				title: i18n.t('clipboard.pubkyCopied'),
				description: i18n.t('clipboard.pubkyCopiedDescription'),
			});
		}, [pubky]);

		const pubkyUri = useMemo(() => (pubky.startsWith('pk:') ? pubky.slice(3) : pubky), [pubky]);

		const pubkyName = useMemo(() => {
			if (pubkyData?.name) {
				return pubkyData.name;
			}
			if (index !== undefined) {
				return `${i18n.t('emptyState.placeholderName')} #${index + 1}`;
			}
			return i18n.t('emptyState.placeholderName');
		}, [index, pubkyData.name]);

		return (
			<View style={[styles.profileContainer, smallScreenStyle]}>
				<Card style={styles.profile}>
					<View style={styles.avatarContainer}>
						<ProfileAvatar pubky={pubky} size={96} />
					</View>

					<Text style={styles.nameText}>{pubkyName}</Text>

					<TouchableOpacity activeOpacity={0.7} onPress={handleCopyPubky}>
						<Text style={styles.pubkyText}>{pubkyUri}</Text>
					</TouchableOpacity>
				</Card>

				{!hideButton && (
					<Button
						text={buttonText ?? ''}
						size="large"
						variant="secondary"
						icon={buttonIcon}
						loading={isButtonLoading}
						onPress={onButtonPress}
					/>
				)}
			</View>
		);
	},
);

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		borderRadius: 16,
	},
	profileContainer: {
		padding: 36,
		backgroundColor: 'transparent',
	},
	profile: {
		paddingBottom: 16,
		backgroundColor: 'transparent',
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
		marginBottom: 16,
	},
	nameText: {
		...textStyles.heading,
		paddingBottom: 12,
		textAlign: 'center',
		backgroundColor: 'transparent',
	},
	pubkyText: {
		...textStyles.bodyMSB,
		textAlign: 'center',
		marginBottom: 8,
	},
});

export default PubkyProfile;
