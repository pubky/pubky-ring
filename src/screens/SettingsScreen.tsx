import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { View as ThemedView } from '../theme/components.ts';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import Button from '../components/Button.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { getAutoAuth, getNavigationAnimation, getTheme } from '../store/selectors/settingsSelectors.ts';
import { getOwnedPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import { setTheme } from '../theme/helpers.ts';
import { ENavigationAnimation, ETheme } from '../types/settings.ts';
import {
	resetSettings,
	updateAutoAuth,
	updateNavigationAnimation,
	updateShowOnboarding,
} from '../store/slices/settingsSlice.ts';
import { wipeKeychain } from '../utils/keychain.ts';
import { resetPubkys } from '../store/slices/pubkysSlice.ts';
import { useTranslation } from 'react-i18next';
import { SheetManager } from 'react-native-actions-sheet';
import { useInputHandler } from '../hooks/useInputHandler.ts';
import { BodyMSBText, BodyMText, BodySText, CaptionText } from '../theme/typography';
import { setOnMigrationComplete } from '../utils/actions/migrateAction.ts';
import SafeAreaView from '../components/SafeAreaView.tsx';
import { Qrcode, Scan } from '../icons/index.ts';
import { clearOwnedSharedPubkys, withPubkyIdentityLifecycle } from '../utils/sharedPubky.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation, route }: Props): ReactElement => {
	const showSecretSettings = route.params?.showSecretSettings ?? true;
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const currentTheme = useSelector(getTheme);
	const autoAuth = useSelector(getAutoAuth);
	const navigationAnimation = useSelector(getNavigationAnimation);
	const pubkyKeys = useSelector(getOwnedPubkyKeys);
	const hasPubkys = pubkyKeys.length > 0;
	const [enableAutoAuth, setEnableAutoAuth] = useState(autoAuth);
	const { showScanner } = useInputHandler({});

	const getThemeDisplayText = useCallback(
		(theme: ETheme) => {
			const themeText = {
				[ETheme.system]: t('settings.theme.system'),
				[ETheme.light]: t('settings.theme.light'),
				[ETheme.dark]: t('settings.theme.dark'),
			};
			return themeText[theme] || t('settings.theme.system');
		},
		[t],
	);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const themeDisplayText = useMemo(
		() => getThemeDisplayText(currentTheme),
		[currentTheme, getThemeDisplayText],
	);

	const navigationAnimationText = useMemo(() => {
		const animationText = {
			[ENavigationAnimation.slideFromRight]: t('settings.animation.slide'),
			[ENavigationAnimation.fade]: t('settings.animation.fade'),
		};
		return animationText[navigationAnimation] || t('settings.animation.slide');
	}, [navigationAnimation, t]);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleThemePress = useCallback(() => {
		switch (currentTheme) {
			case ETheme.system:
				setTheme({ dispatch, theme: ETheme.light });
				break;
			case ETheme.light:
				setTheme({ dispatch, theme: ETheme.dark });
				break;
			case ETheme.dark:
				setTheme({ dispatch, theme: ETheme.system });
				break;
		}
	}, [currentTheme, dispatch]);

	const handleNavigationAnimationPress = useCallback(() => {
		switch (navigationAnimation) {
			case ENavigationAnimation.slideFromRight:
				dispatch(updateNavigationAnimation({ navigationAnimation: ENavigationAnimation.fade }));
				break;
			case ENavigationAnimation.fade:
				dispatch(updateNavigationAnimation({ navigationAnimation: ENavigationAnimation.slideFromRight }));
				break;
		}
	}, [dispatch, navigationAnimation]);

	const handleWipePubkyRing = useCallback(() => {
		Alert.alert(t('settings.wipeConfirmTitle'), t('settings.wipeConfirmMessage'), [
			{
				text: t('common.no'),
				style: 'cancel',
			},
			{
				text: t('common.yes'),
				onPress: async (): Promise<void> => {
					const wiped = await withPubkyIdentityLifecycle(async () => {
						// Shared-first removal preserves the canonical private source on failure.
						if (!(await clearOwnedSharedPubkys()) || !(await wipeKeychain())) return false;
						// Verify absence again while reconciliation is still excluded.
						return await clearOwnedSharedPubkys();
					});
					if (!wiped) {
						Alert.alert(t('common.error'), t('pubkyErrors.errorDeletingPubky'));
						return;
					}
					dispatch(resetSettings());
					dispatch(resetPubkys());
					navigation.reset({
						index: 0,
						routes: [{ name: 'Onboarding' }],
					});
				},
				style: 'destructive',
			},
		]);
	}, [dispatch, navigation, t]);

	const handleShowOnboarding = useCallback(() => {
		dispatch(updateShowOnboarding({ showOnboarding: true }));
		navigation.reset({
			index: 0,
			routes: [{ name: 'TermsOfUse' }],
		});
	}, [dispatch, navigation]);

	const handleAutoAuthToggle = useCallback(() => {
		dispatch(updateAutoAuth({ autoAuth: !enableAutoAuth }));
		setEnableAutoAuth(prev => !prev);
	}, [dispatch, enableAutoAuth]);

	// const handleBackupPress = useCallback(() => {
	// 	// Backup implementation to be added
	// 	console.log('Backup all pubkys');
	// }, []);

	const handleShowQRPress = useCallback(async () => {
		await SheetManager.show('migrate-modal');
	}, []);

	const handleScanQRPress = useCallback(async () => {
		// Reset to Home when migration completes (prevents swipe-back to Settings)
		setOnMigrationComplete(() => {
			navigation.reset({
				index: 0,
				routes: [{ name: 'Home' }],
			});
			setOnMigrationComplete(null); // Clean up
		});

		await showScanner({ title: t('settings.migrateKeys') });
	}, [showScanner, t, navigation]);

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<AppHeader title={t('screenTitles.settings')} />

			<View style={styles.content}>
				{/**
                 TODO: Adjust light-mode gradient colors.
                 <ThemedView style={styles.section} colorName="buttonBackground">
                 <TouchableOpacity onPress={handleThemePress} style={styles.themeButton}>
                 <BodyMSBText>Theme</BodyMSBText>
                 <BodySText colorName="textTertiary">
                 {themeDisplayText}
                 </BodySText>
                 </TouchableOpacity>
                 </ThemedView>
                 **/}

				<View style={styles.textSection}>
					<CaptionText>{t('settings.migrateToOtherDevice')}</CaptionText>
					<BodyMText style={styles.textSettingValue}>{t('settings.migrateDescription')}</BodyMText>
				</View>

				<View style={styles.buttonContainer}>
					{hasPubkys && (
						<Button
							testID="ShowQRButton"
							style={styles.button}
							text={t('settings.showQR')}
							size="medium"
							onPress={handleShowQRPress}
							icon={<Qrcode size={24} />}
						/>
					)}
					<Button
						testID="ScanQRButton"
						style={styles.button}
						text={t('settings.scanQR')}
						size="medium"
						onPress={handleScanQRPress}
						icon={<Scan size={24} />}
					/>
				</View>

				{showSecretSettings && (
					<ThemedView style={styles.section} colorName="buttonBackground">
						<TouchableOpacity
							onPress={handleNavigationAnimationPress}
							style={styles.navigationAnimationButton}
						>
							<BodyMSBText>{t('settings.navigationAnimation')}</BodyMSBText>
							<BodySText colorName="textTertiary">{navigationAnimationText}</BodySText>
						</TouchableOpacity>
					</ThemedView>
				)}

				{showSecretSettings && (
					<ThemedView style={styles.section} colorName="buttonBackground">
						<TouchableOpacity onPress={handleAutoAuthToggle} style={styles.toggleRow}>
							<BodyMSBText>{t('settings.autoAuth')}</BodyMSBText>
							<View style={styles.switchContainer}>
								<Switch value={enableAutoAuth} onValueChange={handleAutoAuthToggle} />
							</View>
						</TouchableOpacity>
					</ThemedView>
				)}

				{showSecretSettings && (
					<ThemedView style={styles.section} colorName="buttonBackground">
						<TouchableOpacity onPress={handleShowOnboarding} style={styles.navigationAnimationButton}>
							<BodyMSBText>{t('settings.showOnboarding')}</BodyMSBText>
						</TouchableOpacity>
					</ThemedView>
				)}

				{showSecretSettings && (
					<ThemedView style={styles.section} colorName="buttonBackground">
						<TouchableOpacity onPress={handleWipePubkyRing} style={styles.navigationAnimationButton}>
							<BodyMSBText>{t('settings.wipePubkyRing')}</BodyMSBText>
						</TouchableOpacity>
					</ThemedView>
				)}

				{/* Backup all pubkys */}
				{/* TODO: Consider implementing a "Backup All Pubkys" feature. Backs up all pubkys with same passphrase and saves as zip file for future import
				<ThemedView style={styles.section} colorName="buttonBackground">
					<TouchableOpacity
						onPress={handleBackupPress}
						style={styles.backupButton}
					>
						<BodyMSBText>Backup All Pubkys</BodyMSBText>
					</TouchableOpacity>
				</ThemedView>
				*/}
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingTop: HEADER_HEIGHT + 24,
		paddingHorizontal: 24,
	},
	textSection: {
		marginBottom: 12,
	},
	section: {
		marginBottom: 16,
		borderRadius: 16,
		overflow: 'hidden',
	},
	textSettingValue: {
		marginTop: 10,
	},
	switchContainer: {
		justifyContent: 'center',
	},
	themeButton: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		paddingHorizontal: 16,
		height: 60,
		width: '100%',
	},
	navigationAnimationButton: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		height: 60,
	},
	toggleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		height: 60,
		width: '100%',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(SettingsScreen);
