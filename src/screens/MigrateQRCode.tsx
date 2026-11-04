import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	AppState,
	Platform,
	Pressable,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import DeviceBrightness from '@adrianso/react-native-device-brightness';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import { getPubkySecretKey } from '../utils/pubky.ts';
import { getBackupPreference, getPubkyDataFromStore } from '../utils/store-helpers.ts';
import { EBackupPreference, IKeychainData } from '../types/pubky.ts';
import AnimatedQR from '../components/AnimatedQR.tsx';
import { SheetScreen } from '../components/Sheet.tsx';
import { TextBaseM, TextBaseB, TextXsM, TextSmB, TextSmM } from '../theme/typography';
import BlurView from '../components/BlurView.tsx';
import { shadows } from '../theme/shadows.ts';
import { useSensitiveAction } from '../hooks/useSensitiveAction';
import { usePrivacyCover } from '../hooks/usePrivacyCover';
import { assertNotAborted, requireDeviceAuthentication } from '../utils/deviceAuth';
import { setSecureWindow } from '../utils/secureWindow.ts';

const placeholderData = [{ value: 'pubkyring://migrate' }];

const MigrateQRCode = (): ReactElement => {
	const { t } = useTranslation();
	usePrivacyCover();
	const { width } = useWindowDimensions();
	const pubkyKeys = useSelector(getPubkyKeys);
	const [keyValues, setKeyValues] = useState<string[]>([]);
	const { run, busy: isLoading, error, cancel } = useSensitiveAction();
	const [isRevealed, setIsRevealed] = useState(false);
	const originalBrightnessRef = useRef<number | null>(null);
	const brightnessRequestIdRef = useRef(0);
	const displayedKeyCount = pubkyKeys.filter(pubky => !getPubkyDataFromStore(pubky)?.sourceApp).length;
	const qrSize = Math.min(280, Math.max(220, width - 80));

	const restoreBrightness = useCallback((): void => {
		if (originalBrightnessRef.current !== null) {
			DeviceBrightness.setBrightnessLevel(originalBrightnessRef.current)
				.then(() => {
					originalBrightnessRef.current = null;
				})
				.catch(failure => console.warn('Failed to restore brightness:', failure));
		}
	}, []);

	const hideQRCode = useCallback((): void => {
		brightnessRequestIdRef.current += 1;
		setIsRevealed(false);
		setKeyValues([]);
		setSecureWindow(false);
		restoreBrightness();
	}, [restoreBrightness]);

	useEffect(() => {
		return (): void => {
			cancel();
			setSecureWindow(false);
			restoreBrightness();
		};
	}, [cancel, restoreBrightness]);

	useEffect(() => {
		const subscriptions = [
			AppState.addEventListener('change', nextAppState => {
				if (nextAppState !== 'active') {
					hideQRCode();
				}
			}),
		];

		if (Platform.OS === 'android') {
			subscriptions.push(AppState.addEventListener('blur', hideQRCode));
		}

		return (): void => {
			subscriptions.forEach(subscription => subscription.remove());
		};
	}, [hideQRCode]);

	const revealQRCode = useCallback((): void => {
		run(async signal => {
			await requireDeviceAuthentication(t('deviceAuth.migrate'), signal);
			const values: string[] = [];
			for (const pubky of pubkyKeys) {
				assertNotAborted(signal);
				const identity = getPubkyDataFromStore(pubky);
				if (!identity) throw new Error(t('backup.couldNotRetrieveSecretKey'));
				if (identity.sourceApp) continue;
				const result = await getPubkySecretKey(pubky);
				assertNotAborted(signal);
				if (!getPubkyDataFromStore(pubky) || getPubkyDataFromStore(pubky).sourceApp || result.isErr())
					throw new Error(t('backup.couldNotRetrieveSecretKey'));
				const keyData: IKeychainData = result.value;
				values.push(
					getBackupPreference(pubky) === EBackupPreference.encryptedFile
						? keyData.secretKey
						: keyData.mnemonic || keyData.secretKey,
				);
			}
			assertNotAborted(signal);
			setKeyValues(values);
			const requestId = ++brightnessRequestIdRef.current;
			setSecureWindow(true);
			setIsRevealed(true);
			DeviceBrightness.getBrightnessLevel()
				.then(currentBrightness => {
					if (brightnessRequestIdRef.current !== requestId) return;
					originalBrightnessRef.current = currentBrightness;
					return DeviceBrightness.setBrightnessLevel(1);
				})
				.catch(failure => console.warn('Failed to set brightness:', failure));
		});
	}, [pubkyKeys, run, t]);

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
					<TextBaseM style={styles.loadingText}>{t('common.loading')}</TextBaseM>
				</View>
			);
		}

		if (displayedKeyCount === 0) {
			return (
				<View style={styles.centerContent}>
					<TextBaseB colorName="mutedForeground">{t('settings.noKeysToDisplay')}</TextBaseB>
				</View>
			);
		}

		return (
			<>
				<View style={styles.qrRevealContainer}>
					<AnimatedQR
						data={isRevealed ? migrateFormattedData : placeholderData}
						startCycleInterval={200}
						cycleInterval={600}
						transitionDuration={60000}
						size={qrSize}
					/>

					{!isRevealed && (
						<>
							<BlurView style={styles.blurOverlay} tintEnabled={true} />

							<View style={styles.revealButtonContainer} pointerEvents="box-none">
								<Pressable
									style={styles.revealButton}
									testID="MigrateQRCodeRevealButton"
									onPress={revealQRCode}
								>
									<TextSmB numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
										{t('backup.tapToReveal')}
									</TextSmB>
								</Pressable>
							</View>
						</>
					)}
				</View>

				<TextSmM>{t('settings.migrationQRWarning')}</TextSmM>
			</>
		);
	};

	return (
		<SheetScreen id="migrate" title={t('settings.migrateKeys')}>
			<View style={styles.textContainer}>
				<TextXsM>{t('settings.scanDynamicQR')}</TextXsM>
				<TextBaseM style={styles.description}>
					{t('settings.scanDynamicQRDescription', { count: displayedKeyCount })}
				</TextBaseM>
			</View>

			{!!error && <TextSmM accessibilityRole="alert">{error}</TextSmM>}
			{renderContent()}
		</SheetScreen>
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
	qrRevealContainer: {
		position: 'relative',
		alignSelf: 'center',
		borderRadius: 16,
		overflow: 'visible',
		marginBottom: 24,
	},
	blurOverlay: {
		...StyleSheet.absoluteFill,
		borderRadius: 16,
		overflow: 'hidden',
	},
	revealButtonContainer: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
	},
	revealButton: {
		backgroundColor: '#111115',
		paddingHorizontal: 28,
		paddingVertical: 18,
		borderRadius: 64,
		borderWidth: 1,
		borderColor: '#303034',
		...shadows.xs,
	},
});

export default memo(MigrateQRCode);
