import React, { memo, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';
import DeviceBrightness from '@adrianso/react-native-device-brightness';
import {
	ActionSheetContainer,
	Card,
	SkiaGradient,
	Text,
	View,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { getPubkyKeys, getPubkyName } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../types';
import { getPubkySecretKey } from '../utils/pubky.ts';
import { getBackupPreference } from '../utils/store-helpers.ts';
import { EBackupPreference, IKeychainData } from '../types/pubky.ts';
import ModalIndicator from './ModalIndicator.tsx';
import AnimatedQR from './AnimatedQR.tsx';
import {
	ACTION_SHEET_HEIGHT,
	SMALL_SCREEN_ACTION_SHEET_HEIGHT,
} from '../utils/constants.ts';
import { isSmallScreen } from '../utils/helpers.ts';
import { useTranslation } from 'react-i18next';

const smallScreen = isSmallScreen();
const actionSheetHeight = smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;

interface KeyData {
	pubky: string;
	value: string;
	name: string;
}

const MigrateModal = ({ payload }: {
	payload: {
		onClose: () => void;
	};
}): ReactElement => {
	const { t } = useTranslation();
	const navigationAnimation = useSelector(getNavigationAnimation);
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
				DeviceBrightness.setBrightnessLevel(originalBrightnessRef.current).catch(
					(error) => console.warn('Failed to restore brightness:', error)
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
			value: `pubkyring://migrate?index=${index}&total=${keysData.length}&key=${encodeURIComponent(keyData.value)}`,
		}));
	}, [keysData]);

	const renderContent = (): ReactElement => {
		if (isLoading) {
			return (
				<View style={styles.centerContent}>
					<ActivityIndicator size="large" color="#FFFFFF" />
					<Text style={styles.loadingText}>{t('common.loading')}</Text>
				</View>
			);
		}

		if (keysData.length === 0) {
			return (
				<View style={styles.centerContent}>
					<Text style={styles.noKeysText}>{t('settings.noKeysToDisplay')}</Text>
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
		<ActionSheetContainer
			id="migrate-modal"
			navigationAnimation={navigationAnimation}
			onClose={onClose}
			keyboardHandlerEnabled={false}
			isModal={Platform.OS === 'ios'}
			CustomHeaderComponent={<></>}
			height={actionSheetHeight}
		>
			<SkiaGradient modal={true} style={styles.gradientContainer}>
				<View style={styles.container}>
					<ModalIndicator />
					<Text style={styles.title}>{t('settings.migrateKeys')}</Text>
					<Card style={styles.card}>
						<Text style={styles.cardLabel}>{t('settings.scanDynamicQR')}</Text>
						<Text style={styles.cardDescription}>
							{t('settings.scanDynamicQRDescription', { count: pubkyKeys.length })}
						</Text>
					</Card>

					{renderContent()}

					<View style={styles.footer}>
						<View style={styles.buttonContainer}>
							<Button
								text={t('common.close')}
								style={styles.button}
								onPress={onClose}
							/>
						</View>
					</View>
				</View>
			</SkiaGradient>
		</ActionSheetContainer>
	);
};

const styles = StyleSheet.create({
	gradientContainer: {
		height: '100%',
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		paddingHorizontal: 24,
	},
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		alignSelf: 'center',
		marginBottom: 16,
	},
	card: {
		marginBottom: 16,
		borderRadius: 16,
		overflow: 'hidden',
		padding: 16,
		backgroundColor: 'transparent',
	},
	cardLabel: {
		fontSize: 13,
		fontWeight: '500',
		lineHeight: 18,
		letterSpacing: 0.8,
		color: 'rgba(255, 255, 255, 0.64)',
	},
	cardDescription: {
		fontSize: 17,
		fontWeight: '400',
		lineHeight: 22,
		letterSpacing: 0,
		marginTop: 10,
		color: 'rgba(255, 255, 255, 0.8)',
	},
	centerContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 15,
		color: '#E0E0E0',
	},
	noKeysText: {
		fontSize: 17,
		fontWeight: '500',
		color: '#888',
		textAlign: 'center',
	},
	footer: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'transparent',
	},
	buttonContainer: {
		width: '100%',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	button: {
		width: '100%',
		minHeight: 56,
	},
});

export default memo(MigrateModal);
