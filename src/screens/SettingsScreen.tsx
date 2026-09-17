import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import { showToast } from '@synonymdev/react-native-toast';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ThemedView } from '../theme/components.ts';
import AppHeader, { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import Button from '../components/Button.tsx';
import { useDispatch, useSelector } from 'react-redux';
import { getAutoAuth, getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { getAllPubkys, getOwnedPubkyKeys } from '../store/selectors/pubkySelectors.ts';
import { ENavigationAnimation } from '../types/settings.ts';
import {
	resetSettings,
	updateAutoAuth,
	updateNavigationAnimation,
	updateShowOnboarding,
} from '../store/slices/settingsSlice.ts';
import { wipeKeychain } from '../utils/keychain.ts';
import { resetPubkys } from '../store/slices/pubkysSlice.ts';
import { useTranslation } from 'react-i18next';
import { showSheet } from '../sheets/sheetNavigation.tsx';
import { TextBaseB, TextBaseM, TextSmM, TextXsM } from '../theme/typography';
import SafeAreaView from '../components/SafeAreaView.tsx';
import { Qrcode, Scan } from '../icons/index.ts';
import { republishAllHomeserverRecords } from '../utils/pubky.ts';
import { clearOwnedSharedPubkys, withPubkyIdentityLifecycle } from '../utils/sharedPubky.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation, route }: Props): ReactElement => {
	const showSecretSettings = route.params?.showSecretSettings ?? true;
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const autoAuth = useSelector(getAutoAuth);
	const navigationAnimation = useSelector(getNavigationAnimation);
	// Backup/migration must never export a borrowed identity's key, and republishing a homeserver
	// record is an ownership action, so both are gated on owned keys only.
	const ownedPubkyKeys = useSelector(getOwnedPubkyKeys);
	const pubkys = useSelector(getAllPubkys);
	const hasOwnedPubkys = ownedPubkyKeys.length > 0;
	const hasRepublishablePubkys = useMemo(
		() => ownedPubkyKeys.some(key => !!pubkys[key]?.homeserver),
		[ownedPubkyKeys, pubkys],
	);
	const [enableAutoAuth, setEnableAutoAuth] = useState(autoAuth);
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

			<View style={styles.content}>
				<View>
					<View style={styles.textSection}>
						<TextXsM>{t('settings.migrateToOtherDevice')}</TextXsM>
						<TextBaseM style={styles.sectionDescription}>{t('settings.migrateDescription')}</TextBaseM>
					</View>

					<View style={styles.buttonContainer}>
						{hasOwnedPubkys && (
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

				{hasOwnedPubkys && (
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

				{showSecretSettings && (
					<View>
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
									<Switch value={enableAutoAuth} onValueChange={handleAutoAuthToggle} />
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
