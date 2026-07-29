import React, { ReactElement } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { BodyMBText, BodyMSBText, BodyMText, DisplayText } from '../theme/typography.ts';
import Button from '../components/Button.tsx';
import Sheet from '../components/Sheet.tsx';
import { RootStackParamList } from '../navigation/types.ts';

const REPLACEMENT_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.pubkyring';

const openUrl = async (url: string): Promise<void> => {
	await Linking.openURL(url);
};

const DownloadIcon = (): ReactElement => (
	<Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
		<Path
			d="M12 3v11m0 0 4-4m-4 4-4-4M5 14v5h14v-5"
			stroke="white"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
		/>
	</Svg>
);

const LegacySunsetSheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'LegacySunsetSheet'>): ReactElement => {
	const { t } = useTranslation();
	const { apkUrl } = route.params;

	return (
		<Sheet id="legacy-sunset" title={t('legacySunset.sheetTitle')}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={styles.introduction}>
					<DisplayText>{t('legacySunset.headline')}</DisplayText>
					<BodyMText>{t('legacySunset.introduction')}</BodyMText>
				</View>

				<View style={styles.notice}>
					<BodyMBText color="#061a2f">{t('legacySunset.keepInstalledTitle')}</BodyMBText>
					<BodyMText color="#061a2f">{t('legacySunset.keepInstalledDescription')}</BodyMText>
				</View>

				<View style={styles.steps}>
					{([1, 2, 3, 4, 5] as const).map(step => (
						<View style={styles.step} key={step}>
							<BodyMBText colorName="pubkyRing" style={styles.stepNumber}>
								{step}.
							</BodyMBText>
							<BodyMSBText style={styles.stepCopy}>{t(`legacySunset.transferStep${step}`)}</BodyMSBText>
						</View>
					))}
				</View>

				<View style={styles.actions}>
					<Button
						text={t('legacySunset.openPlayStore')}
						variant="secondary"
						icon={<BodyMBText style={styles.googleIcon}>G</BodyMBText>}
						style={styles.actionButton}
						testID="legacy-sunset-play-store"
						onPress={() => openUrl(REPLACEMENT_PLAY_STORE_URL)}
					/>
					<Button
						text={t('legacySunset.downloadApk')}
						variant="secondary"
						icon={<DownloadIcon />}
						style={styles.actionButton}
						testID="legacy-sunset-download-apk"
						onPress={() => openUrl(apkUrl)}
					/>
				</View>
			</ScrollView>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	content: {
		gap: 16,
		paddingBottom: 24,
	},
	introduction: {
		gap: 8,
	},
	notice: {
		gap: 6,
		padding: 16,
		borderRadius: 12,
		backgroundColor: '#0085FF',
	},
	steps: {
		gap: 12,
	},
	step: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		minHeight: 44,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	stepCopy: {
		flex: 1,
		fontSize: 14,
		lineHeight: 18,
		letterSpacing: 0,
	},
	stepNumber: {
		fontSize: 14,
		lineHeight: 18,
		letterSpacing: 0,
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
		marginTop: 4,
	},
	actionButton: {
		flex: 1,
		height: 56,
	},
	googleIcon: {
		fontSize: 22,
	},
});

export default LegacySunsetSheet;
