import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { showToast } from '@synonymdev/react-native-toast';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from 'styled-components/native';
import { RootStackParamList } from '../navigation/types';
import type { Theme } from '../theme';
import { ThemedView } from '../theme/components.ts';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import Button from '../components/Button.tsx';
import { useDispatch, useSelector } from 'react-redux';
import {
	getAlwaysShowAuthDetails,
	getAutoAuth,
	getRequireDeviceAuth,
	getNavigationAnimation,
} from '../store/selectors/settingsSelectors.ts';
import { getAllPubkys, getPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import { ENavigationAnimation } from '../types/settings.ts';
import {
	resetSettings,
	updateAutoAuth,
	updateRequireDeviceAuth,
	updateAlwaysShowAuthDetails,
	updateNavigationAnimation,
	updateShowOnboarding,
} from '../store/slices/settingsSlice.ts';
import { wipeKeychain } from '../utils/keychain.ts';
import { resetPubkys } from '../store/slices/pubkysSlice.ts';
import { useTranslation } from 'react-i18next';
import { showSheet } from '../sheets/sheetNavigation.tsx';
import { TextBaseB, TextBaseM, TextSmM, TextXsM } from '../theme/typography';
import SafeAreaView from '../components/SafeAreaView.tsx';
import { Info, Qrcode, Scan } from '../icons/index.ts';
import { useSensitiveAction } from '../hooks/useSensitiveAction';
import {
	authenticateDevice,
	getDeviceAuthAvailability,
	openDeviceAuthSettings,
	assertNotAborted,
	DeviceAuthError,
} from '../utils/deviceAuth';
import { republishAllHomeserverRecords } from '../utils/pubky.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const AUTH_DISPLAY_OPTIONS = [
	{ value: false, label: 'settings.showBasics', testID: 'AuthShowBasicsOption' },
	{ value: true, label: 'settings.alwaysShowDetails', testID: 'AuthAlwaysShowDetailsOption' },
] as const;

const SettingsScreen = ({ navigation }: Props): ReactElement => {
	const { t } = useTranslation();
	const theme = useTheme() as Theme;
	const dispatch = useDispatch();
	const autoAuth = useSelector(getAutoAuth);
	const requireDeviceAuth = useSelector(getRequireDeviceAuth);
	const deviceAuth = useSensitiveAction();
	const alwaysShowAuthDetails = useSelector(getAlwaysShowAuthDetails);
	const navigationAnimation = useSelector(getNavigationAnimation);
	const pubkyKeys = useSelector(getPubkyKeys);
	const pubkys = useSelector(getAllPubkys);
	const hasPubkys = pubkyKeys.length > 0;
	const hasRepublishablePubkys = useMemo(
		() => Object.values(pubkys).some(pubky => !!pubky.homeserver),
		[pubkys],
	);
	const [republishingAll, setRepublishingAll] = useState(false);

	const navigationAnimationText = useMemo(() => {
		const animationText = {
			[ENavigationAnimation.slideFromRight]: t('settings.animation.slide'),
			[ENavigationAnimation.fade]: t('settings.animation.fade'),
		};
		return animationText[navigationAnimation] || t('settings.animation.slide');
	}, [navigationAnimation, t]);

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
					const wipeRes = await wipeKeychain();
					if (wipeRes.isErr()) {
						showToast({
							type: 'error',
							title: t('common.error'),
							description: t('keychain.failedToResetValue'),
						});
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

	const changeDeviceAuth = (): void => {
		deviceAuth.run(async signal => {
			const availability = await getDeviceAuthAvailability();
			assertNotAborted(signal);
			if (!availability.available) throw new DeviceAuthError('unavailable');
			await authenticateDevice(
				t(requireDeviceAuth ? 'deviceAuth.disableReason' : 'deviceAuth.enableReason'),
				signal,
			);
			assertNotAborted(signal);
			dispatch(updateRequireDeviceAuth({ requireDeviceAuth: !requireDeviceAuth }));
		});
	};
	const handleDeviceAuthToggle = (): void => {
		if (requireDeviceAuth) {
			changeDeviceAuth();
			return;
		}
		Alert.alert(t('deviceAuth.enableTitle'), t('deviceAuth.enableDescription'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{ text: t('deviceAuth.verify'), onPress: changeDeviceAuth },
		]);
	};
	const handleDeviceAuthInfo = (): void => {
		Alert.alert(
			t('deviceAuth.setting'),
			`${t('deviceAuth.description')}\n\n${t('deviceAuth.enrollmentGuidance')}`,
			[
				{ text: t('common.close'), style: 'cancel' },
				{
					text: t('deviceAuth.openSettings'),
					onPress: () => {
						deviceAuth.run(async () => {
							await openDeviceAuthSettings();
						});
					},
				},
			],
		);
	};

	const handleAutoAuthToggle = useCallback(() => {
		dispatch(updateAutoAuth({ autoAuth: !autoAuth }));
	}, [dispatch, autoAuth]);

	const handleScanQRPress = useCallback(() => {
		showSheet('migrate', { screen: 'Scanner' });
	}, []);

	const handleRepublishAllPress = useCallback(async () => {
		setRepublishingAll(true);
		try {
			const summary = await republishAllHomeserverRecords({ pubkys, dispatch });
			if (summary.failed > 0) {
				showToast({
					type: 'error',
					title: t('republish.failed'),
					description: t('republish.allFinishedWithFailures', {
						succeeded: summary.succeeded,
						total: summary.total - summary.skipped,
					}),
				});
				return;
			}

			showToast({
				type: 'success',
				title: t('republish.success'),
				description: t('republish.allFinished', {
					count: summary.succeeded,
				}),
			});
		} finally {
			setRepublishingAll(false);
		}
	}, [dispatch, pubkys, t]);

	return (
		<SafeAreaView style={styles.container} edges={['bottom']}>
			<AppHeader title={t('screenTitles.settings')} />

			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<View>
					<View style={styles.textSection}>
						<TextXsM>{t('homeservers.title')}</TextXsM>
						<TextBaseM style={styles.sectionDescription}>{t('homeservers.description')}</TextBaseM>
					</View>
					<Button
						text={t('homeservers.manage')}
						variant="dark"
						testID="ManageHomeserversButton"
						onPress={() => navigation.navigate('Homeservers')}
					/>
				</View>
				<View accessibilityRole="radiogroup" accessibilityLabel={t('settings.auth')}>
					<TextXsM style={styles.authTitle}>{t('settings.auth')}</TextXsM>
					{AUTH_DISPLAY_OPTIONS.map(({ value, label, testID }) => {
						const checked = alwaysShowAuthDetails === value;
						const text = t(label);
						return (
							<Pressable
								key={testID}
								accessibilityRole="radio"
								accessibilityLabel={text}
								accessibilityState={{ checked }}
								style={styles.authOption}
								testID={testID}
								onPress={() => dispatch(updateAlwaysShowAuthDetails({ alwaysShowAuthDetails: value }))}
							>
								<ThemedView style={styles.radio} colorName={checked ? 'blue' : 'border'}>
									<ThemedView style={styles.radioCenter} colorName="background">
										{checked && <ThemedView style={styles.radioDot} colorName="blue" />}
									</ThemedView>
								</ThemedView>
								<TextBaseM>{text}</TextBaseM>
							</Pressable>
						);
					})}
				</View>
				<View style={styles.deviceAuthSection}>
					<View style={styles.deviceAuthRow}>
						<TextBaseB style={styles.deviceAuthLabel}>{t('deviceAuth.setting')}</TextBaseB>
						<TouchableOpacity
							style={styles.deviceAuthInfo}
							accessibilityRole="button"
							accessibilityLabel={t('deviceAuth.learnMore')}
							testID="DeviceAuthInfoButton"
							disabled={deviceAuth.busy}
							onPress={handleDeviceAuthInfo}
						>
							<Info size={20} />
						</TouchableOpacity>
						<Switch
							style={styles.deviceAuthSwitch}
							testID="RequireDeviceAuthSwitch"
							accessibilityLabel={t('deviceAuth.setting')}
							trackColor={{ false: theme.colors.input, true: theme.colors.blue }}
							ios_backgroundColor={theme.colors.input}
							value={requireDeviceAuth}
							disabled={deviceAuth.busy}
							onValueChange={handleDeviceAuthToggle}
						/>
					</View>
					{!!deviceAuth.error && <TextSmM accessibilityRole="alert">{deviceAuth.error}</TextSmM>}
				</View>
				<View>
					<View style={styles.textSection}>
						<TextXsM>{t('settings.migrateToOtherDevice')}</TextXsM>
						<TextBaseM style={styles.sectionDescription}>{t('settings.migrateDescription')}</TextBaseM>
					</View>

					<View style={styles.buttonContainer}>
						{hasPubkys && (
							<Button
								style={styles.button}
								text={t('settings.showQR')}
								variant="dark"
								icon={<Qrcode />}
								testID="ShowQRButton"
								onPress={() => showSheet('migrate')}
							/>
						)}
						<Button
							style={styles.button}
							text={t('settings.scanQR')}
							variant="dark"
							icon={<Scan />}
							testID="ScanQRButton"
							onPress={handleScanQRPress}
						/>
					</View>
				</View>

				{hasPubkys && (
					<View>
						<View style={styles.textSection}>
							<TextXsM>{t('republish.title')}</TextXsM>
							<TextBaseM style={styles.sectionDescription}>{t('republish.description')}</TextBaseM>
						</View>
						<Button
							text={republishingAll ? t('republish.republishing') : t('republish.all')}
							variant="dark"
							loading={republishingAll}
							disabled={!hasRepublishablePubkys}
							testID="RepublishAllButton"
							onPress={handleRepublishAllPress}
						/>
					</View>
				)}

				{__DEV__ && (
					<View>
						<View style={styles.textSection}>
							<TextXsM>{t('settings.developer')}</TextXsM>
						</View>
						<ThemedView style={styles.devButton} colorName="card">
							<TouchableOpacity
								style={styles.navigationAnimationButton}
								onPress={handleNavigationAnimationPress}
							>
								<TextBaseB>{t('settings.navigationAnimation')}</TextBaseB>
								<TextSmM>{navigationAnimationText}</TextSmM>
							</TouchableOpacity>
						</ThemedView>

						<ThemedView style={styles.devButton} colorName="card">
							<TouchableOpacity style={styles.toggleRow} onPress={handleAutoAuthToggle}>
								<TextBaseB>{t('settings.autoAuth')}</TextBaseB>
								<View style={styles.switchContainer}>
									<Switch
										testID="AutoAuthSwitch"
										value={autoAuth}
										disabled={requireDeviceAuth}
										onValueChange={handleAutoAuthToggle}
									/>
								</View>
							</TouchableOpacity>
						</ThemedView>

						<ThemedView style={styles.devButton} colorName="card">
							<TouchableOpacity style={styles.navigationAnimationButton} onPress={handleShowOnboarding}>
								<TextBaseB>{t('settings.showOnboarding')}</TextBaseB>
							</TouchableOpacity>
						</ThemedView>

						<ThemedView style={styles.devButton} colorName="card">
							<TouchableOpacity style={styles.navigationAnimationButton} onPress={handleWipePubkyRing}>
								<TextBaseB>{t('settings.wipePubkyRing')}</TextBaseB>
							</TouchableOpacity>
						</ThemedView>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	deviceAuthSection: { gap: 8 },
	deviceAuthRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	deviceAuthLabel: { flex: 1 },
	deviceAuthInfo: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
	// The iOS Switch defaults to alignSelf: 'flex-start', overriding the row's centering.
	deviceAuthSwitch: { alignSelf: 'center' },
	authTitle: {
		marginBottom: 8,
	},
	authOption: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 44,
		gap: 12,
		paddingLeft: 4,
	},
	radio: {
		width: 24,
		height: 24,
		borderRadius: 12,
		padding: 1,
	},
	radioCenter: {
		flex: 1,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	container: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	content: {
		paddingTop: HEADER_HEIGHT + 24,
		paddingHorizontal: 24,
		paddingBottom: 24,
		gap: 24,
	},
	textSection: {
		marginBottom: 24,
	},
	devButton: {
		marginBottom: 16,
		borderRadius: 16,
		overflow: 'hidden',
	},
	sectionDescription: {
		marginTop: 10,
	},
	switchContainer: {
		justifyContent: 'center',
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
		gap: 12,
	},
	button: {
		flex: 1,
	},
});

export default memo(SettingsScreen);
