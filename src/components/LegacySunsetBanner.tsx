import React, { memo, ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowRight } from '../icons/index.ts';
import { BodySSBText, BodySText } from '../theme/typography.ts';
import { useTranslation } from 'react-i18next';

export interface LegacySunsetBannerProps {
	onPress: () => void;
}

const LegacySunsetBanner = ({ onPress }: LegacySunsetBannerProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={t('legacySunset.bannerTitle')}
			style={({ pressed }) => [styles.card, pressed && styles.pressed]}
			testID="legacy-sunset-banner"
			onPress={onPress}
		>
			<View style={styles.copy}>
				<BodySSBText color="#061a2f">{t('legacySunset.bannerTitle')}</BodySSBText>
				<BodySText color="#061a2f">{t('legacySunset.bannerDescription')}</BodySText>
			</View>
			<ArrowRight color="#ffffff" size={24} />
		</Pressable>
	);
};

const styles = StyleSheet.create({
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 76,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginHorizontal: 24,
		marginBottom: 12,
		borderRadius: 12,
		backgroundColor: '#0085FF',
	},
	copy: {
		flex: 1,
		gap: 4,
	},
	pressed: {
		opacity: 0.82,
	},
});

export default memo(LegacySunsetBanner);
