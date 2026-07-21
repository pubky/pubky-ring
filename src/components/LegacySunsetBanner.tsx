import React, { memo, ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, Info } from '../icons/index.ts';
import { BodySSBText, BodySText } from '../theme/typography.ts';
import { useTranslation } from 'react-i18next';
import Card from './Card.tsx';

export interface LegacySunsetBannerProps {
	onPress: () => void;
	onDismiss: () => void;
}

const LegacySunsetBanner = ({ onPress, onDismiss }: LegacySunsetBannerProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Card style={styles.card} testID="legacy-sunset-banner">
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t('legacySunset.bannerTitle')}
				style={styles.message}
				onPress={onPress}
			>
				<Info size={24} />
				<View style={styles.copy}>
					<BodySSBText>{t('legacySunset.bannerTitle')}</BodySSBText>
					<BodySText colorName="textSecondary">{t('legacySunset.bannerDescription')}</BodySText>
				</View>
				<ChevronRight size={20} />
			</Pressable>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t('legacySunset.dismiss')}
				hitSlop={12}
				style={styles.dismiss}
				testID="legacy-sunset-banner-dismiss"
				onPress={onDismiss}
			>
				<BodySText colorName="textTertiary">×</BodySText>
			</Pressable>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: {
		padding: 16,
		marginHorizontal: 16,
		marginBottom: 12,
	},
	message: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingRight: 20,
	},
	copy: {
		flex: 1,
		gap: 2,
	},
	dismiss: {
		position: 'absolute',
		top: 4,
		right: 8,
		width: 24,
		height: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(LegacySunsetBanner);
