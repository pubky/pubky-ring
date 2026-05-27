import React, { memo, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import DeviceBrightness from '@adrianso/react-native-device-brightness';
import { useSelector } from 'react-redux';
import { getPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import { getPubkySecretKey } from '../utils/pubky.ts';
import { getBackupPreference } from '../utils/store-helpers.ts';
import { EBackupPreference, IKeychainData } from '../types/pubky.ts';
import AnimatedQR from './AnimatedQR.tsx';
import { useTranslation } from 'react-i18next';
import { BodyMText, BodyMSBText, BodySText, CaptionText } from '../theme/typography';
import Sheet from './Sheet.tsx';

const MigrateModal = (): ReactElement => {
	const { t } = useTranslation();
	const pubkyKeys = useSelector(getPubkyKeys);
	const [keyValues, setKeyValues] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const originalBrightnessRef = useRef<number | null>(null);
	const displayedKeyCount = isLoading ? pubkyKeys.length : keyValues.length;

	// Manage screen brightness for better QR scanning
	useEffect(() => {
		const setBrightness = async (): Promise<void> => {
			try {
				// Save current brightness
				const currentBrightness = await DeviceBrightness.getBrightnessLevel();
				originalBrightnessRef.current = currentBrightness;
				// Set to maximum brightness for QR display
				await DeviceBrightness.setBrightnessLevel(1);
			} catch (error) {
				console.warn('Failed to set brightness:', error);
			}
		};

		setBrightness();

		// Restore brightness on unmount
		return (): void => {
			if (originalBrightnessRef.current !== null) {
				DeviceBrightness.setBrightnessLevel(originalBrightnessRef.current).catch(error =>
					console.warn('Failed to restore brightness:', error),
				);
			}
		};
	}, []);

	// Load all keys on mount
	useEffect(() => {
		let mounted = true;

		const loadKeys = async (): Promise<void> => {
			const values: string[] = [];

			for (const pubky of pubkyKeys) {
				const keyDataResult = await getPubkySecretKey(pubky);
				if (keyDataResult.isErr()) {
					continue;
				}

				const keyData: IKeychainData = keyDataResult.value;
				const backupPref = getBackupPreference(pubky);

				// Respect backup preference when selecting which key to use
				let value: string;
				if (backupPref === EBackupPreference.recoveryPhrase && keyData.mnemonic) {
					value = keyData.mnemonic;
				} else if (backupPref === EBackupPreference.encryptedFile) {
					value = keyData.secretKey;
				} else if (keyData.mnemonic) {
					// Default to mnemonic if available and no preference set
					value = keyData.mnemonic;
				} else {
					value = keyData.secretKey;
				}

				if (value) {
					values.push(value);
				}
			}

			if (mounted) {
				setKeyValues(values);
				setIsLoading(false);
			}
		};

		loadKeys();

		return (): void => {
			mounted = false;
		};
	}, [pubkyKeys]);

	// Format keys data for migration QR codes with deeplink format
	const migrateFormattedData = useMemo(() => {
		return keyValues.map((value, index) => ({
			value: `pubkyring://migrate?index=${index}&total=${keyValues.length}&key=${encodeURIComponent(value)}`,
		}));
	}, [keyValues]);

	const renderContent = (): ReactElement => {
		if (isLoading) {
			return (
				<View style={styles.centerContent}>
					<ActivityIndicator size="large" color="#FFFFFF" />
					<BodyMText style={styles.loadingText}>{t('common.loading')}</BodyMText>
				</View>
			);
		}

		if (keyValues.length === 0) {
			return (
				<View style={styles.centerContent}>
					<BodyMSBText colorName="textTertiary">{t('settings.noKeysToDisplay')}</BodyMSBText>
				</View>
			);
		}

		return (
			<AnimatedQR
				data={migrateFormattedData}
				startCycleInterval={200}
				cycleInterval={600}
				transitionDuration={60000}
			/>
		);
	};

	return (
		<Sheet id="migrate-modal" title={t('settings.migrateKeys')}>
			<View style={styles.textContainer}>
				<CaptionText>{t('settings.scanDynamicQR')}</CaptionText>
				<BodyMText style={styles.description}>
					{t('settings.scanDynamicQRDescription', { count: displayedKeyCount })}
				</BodyMText>
			</View>

			{renderContent()}
		</Sheet>
	);
};

const styles = StyleSheet.create({
	textContainer: {
		marginBottom: 24,
	},
	description: {
		marginTop: 12,
	},
	centerContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginTop: 12,
	},
});

export default memo(MigrateModal);
