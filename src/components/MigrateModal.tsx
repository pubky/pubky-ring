import React, { memo, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import DeviceBrightness from '@adrianso/react-native-device-brightness';
import { useSelector } from 'react-redux';
import { getPubkyKeys, getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { getPubkySecretKey } from '../utils/pubky.ts';
import { getBackupPreference } from '../utils/store-helpers.ts';
import { EBackupPreference, IKeychainData } from '../types/pubky.ts';
import AnimatedQR from './AnimatedQR.tsx';
import { useTranslation } from 'react-i18next';
import { BodyMText, BodyMSBText, BodySText, CaptionText } from '../theme/typography';
import Sheet from './Sheet.tsx';

interface KeyData {
	pubky: string;
	value: string;
	name: string;
}

const MigrateModal = ({
	payload,
}: {
	payload: {
		onClose: () => void;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const pubkyKeys = useSelector(getPubkyKeys);
	const [keysData, setKeysData] = useState<KeyData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const onClose = useMemo(() => payload?.onClose ?? ((): void => {}), [payload]);
	const rootState = useSelector((s: RootState) => s);
	const originalBrightnessRef = useRef<number | null>(null);

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
			const data: KeyData[] = [];

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
					const name = getPubkyName(rootState, pubky, 20);
					data.push({ pubky, value, name });
				}
			}

			if (mounted) {
				setKeysData(data);
				setIsLoading(false);
			}
		};

		loadKeys();

		return (): void => {
			mounted = false;
		};
	}, [pubkyKeys, rootState]);

	// Format keys data for migration QR codes with deeplink format
	const migrateFormattedData = useMemo(() => {
		return keysData.map((keyData, index) => ({
			value: `pubkyring://migrate?index=${index}&total=${keysData.length}&key=${encodeURIComponent(
				keyData.value,
			)}`,
		}));
	}, [keysData]);

	const renderContent = (): ReactElement => {
		if (isLoading) {
			return (
				<View style={styles.centerContent}>
					<ActivityIndicator size="large" color="#FFFFFF" />
					<BodySText style={styles.loadingText}>{t('common.loading')}</BodySText>
				</View>
			);
		}

		if (keysData.length === 0) {
			return (
				<View style={styles.centerContent}>
					<BodyMSBText colorName="textTertiary" style={styles.noKeysText}>
						{t('settings.noKeysToDisplay')}
					</BodyMSBText>
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
		<Sheet id="migrate-modal" title={t('settings.migrateKeys')} onClose={onClose}>
			<View style={styles.textContainer}>
				<CaptionText>{t('settings.scanDynamicQR')}</CaptionText>
				<BodyMText style={styles.description}>
					{t('settings.scanDynamicQRDescription', { count: pubkyKeys.length })}
				</BodyMText>
			</View>

			{renderContent()}
		</Sheet>
	);
};

const styles = StyleSheet.create({
	textContainer: {
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	description: {
		marginTop: 10,
	},
	centerContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginTop: 16,
	},
	noKeysText: {
		textAlign: 'center',
	},
});

export default memo(MigrateModal);
