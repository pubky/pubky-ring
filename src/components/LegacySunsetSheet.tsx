import React, { ReactElement, useCallback } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SheetManager } from 'react-native-actions-sheet';
import { BodyMSBText, BodyMText, BodySText } from '../theme/typography.ts';
import Button from './Button.tsx';
import Sheet from './Sheet.tsx';

export interface LegacySunsetSheetPayload {
	playStoreUrl: string;
	apkUrl: string;
	releaseUrl: string;
	onOpenPlayStore?: (url: string) => void | Promise<void>;
	onOpenApk?: (url: string) => void | Promise<void>;
	onOpenRelease?: (url: string) => void | Promise<void>;
}

const openUrl = async (url: string, callback?: (url: string) => void | Promise<void>): Promise<void> => {
	if (callback) {
		await callback(url);
		return;
	}
	await Linking.openURL(url);
};

const LegacySunsetSheet = ({ payload }: { payload: LegacySunsetSheetPayload }): ReactElement => {
	const { t } = useTranslation();
	const close = useCallback(() => SheetManager.hide('legacy-sunset'), []);

	return (
		<Sheet id="legacy-sunset" title={t('legacySunset.sheetTitle')} onBackPress={close}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<BodyMText>{t('legacySunset.introduction')}</BodyMText>

				<View style={styles.notice}>
					<BodyMSBText>{t('legacySunset.keepInstalledTitle')}</BodyMSBText>
					<BodySText colorName="textSecondary">{t('legacySunset.keepInstalledDescription')}</BodySText>
				</View>

				<BodyMSBText>{t('legacySunset.transferTitle')}</BodyMSBText>
				<BodySText colorName="textSecondary">{t('legacySunset.transferStepOne')}</BodySText>
				<BodySText colorName="textSecondary">{t('legacySunset.transferStepTwo')}</BodySText>
				<BodySText colorName="textSecondary">{t('legacySunset.transferStepThree')}</BodySText>

				<View style={styles.actions}>
					<Button
						text={t('legacySunset.openPlayStore')}
						size="large"
						style={styles.actionButton}
						testID="legacy-sunset-play-store"
						onPress={() => openUrl(payload.playStoreUrl, payload.onOpenPlayStore)}
					/>
					<Button
						text={t('legacySunset.downloadApk')}
						size="large"
						variant="secondary"
						style={styles.actionButton}
						testID="legacy-sunset-download-apk"
						onPress={() => openUrl(payload.apkUrl, payload.onOpenApk)}
					/>
				</View>

				<BodySText
					accessibilityRole="link"
					colorName="textPrimary"
					style={styles.releaseLink}
					testID="legacy-sunset-release-link"
					onPress={() => openUrl(payload.releaseUrl, payload.onOpenRelease)}
				>
					{t('legacySunset.viewRelease')}
				</BodySText>
			</ScrollView>
		</Sheet>
	);
};

const styles = StyleSheet.create({
	content: {
		gap: 16,
		paddingBottom: 24,
	},
	notice: {
		gap: 4,
		padding: 16,
		borderRadius: 12,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	actions: {
		gap: 12,
		marginTop: 8,
	},
	actionButton: {
		flex: 0,
		width: '100%',
	},
	releaseLink: {
		alignSelf: 'center',
		padding: 12,
		textDecorationLine: 'underline',
	},
});

export default LegacySunsetSheet;
