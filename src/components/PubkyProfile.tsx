import React, { memo, useCallback } from 'react';
import { StyleProp, StyleSheet, View, TouchableOpacity, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import { copyToClipboard } from '../utils/clipboard';
import { PubkyData } from '../navigation/types';
import ProfileAvatar from './ProfileAvatar';
import { Text2Xl, TextBaseB } from '../theme/typography';
import Button from './Button.tsx';
import Card from './Card.tsx';

interface PubkyProfileProps {
	index?: number;
	pubky: string;
	pubkyData: PubkyData;
	buttonText?: string;
	buttonIcon?: React.ReactNode;
	isButtonLoading?: boolean;
	style?: StyleProp<ViewStyle>;
	onButtonPress?: () => void;
}

export const PubkyProfile = memo(
	({
		index,
		pubky,
		pubkyData,
		buttonText,
		buttonIcon,
		isButtonLoading = false,
		style,
		onButtonPress,
	}: PubkyProfileProps) => {
		const { t } = useTranslation();

		const handleCopyPubky = useCallback(() => {
			copyToClipboard(pubky);
			showToast({
				type: 'info',
				title: t('clipboard.pubkyCopied'),
				description: pubky,
			});
		}, [pubky, t]);

		const pubkyUri = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
		const pubkyName =
			pubkyData.name ||
			(index !== undefined
				? `${t('emptyState.placeholderName')} #${index + 1}`
				: t('emptyState.placeholderName'));

		return (
			<Card style={[styles.container, style]}>
				<View style={styles.avatarContainer}>
					<ProfileAvatar name={pubkyName} pubky={pubky} size={96} />
				</View>

				<Text2Xl style={styles.nameText}>{pubkyName}</Text2Xl>

				<TouchableOpacity activeOpacity={0.7} onPress={handleCopyPubky}>
					<TextBaseB style={styles.pubkyText}>{pubkyUri}</TextBaseB>
				</TouchableOpacity>

				{onButtonPress && (
					<Button
						style={styles.button}
						text={buttonText ?? ''}
						size="large"
						variant="secondary"
						icon={buttonIcon}
						loading={isButtonLoading}
						onPress={onButtonPress}
					/>
				)}
			</Card>
		);
	},
);

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
	},
	avatarContainer: {
		width: 96,
		height: 96,
		borderRadius: '50%',
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	nameText: {
		paddingBottom: 12,
		textAlign: 'center',
	},
	pubkyText: {
		textAlign: 'center',
	},
	button: {
		width: '100%',
		marginTop: 24,
	},
});

export default PubkyProfile;
