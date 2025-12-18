import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import {
	View,
	Text,
	NavButton,
	Card,
	ActionButton,
	SessionText,
	ArrowLeft,
} from '../theme/components.ts';
import PubkyRingHeader from '../components/PubkyRingHeader';
import { useDispatch, useSelector } from 'react-redux';
import { getAutoAuth, getNavigationAnimation, getTheme } from '../store/selectors/settingsSelectors.ts';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SettingsScreen = ({ navigation, route }: Props): ReactElement => {
	const showSecretSettings = route.params?.showSecretSettings ?? true;
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const currentTheme = useSelector(getTheme);
	const autoAuth = useSelector(getAutoAuth);
	const navigationAnimation = useSelector(getNavigationAnimation);
	const [enableAutoAuth, setEnableAutoAuth] = useState(autoAuth);

	const leftButton = useCallback(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={navigation.goBack}
			hitSlop={{ top: 20,
				bottom: 20,
				left: 20,
				right: 20 }}
		>
			<ArrowLeft size={24} />
		</NavButton>
	), [navigation]);

	const rightButton = useCallback(() => (
		<NavButton style={styles.rightNavButton} />
	),[]);

	const getThemeDisplayText = useCallback((theme: ETheme) => {
		const themeText = {
			[ETheme.system]: t('settings.theme.system'),
			[ETheme.light]: t('settings.theme.light'),
			[ETheme.dark]: t('settings.theme.dark'),
		};
		return themeText[theme] || t('settings.theme.system');
	}, [t]);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const themeDisplayText = useMemo(() => getThemeDisplayText(currentTheme), [currentTheme, getThemeDisplayText]);

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
		Alert.alert(
			t('settings.wipeConfirmTitle'),
			t('settings.wipeConfirmMessage'),
			[
				{
					text: t('common.no'),
					style: 'cancel',
				},
				{
					text: t('common.yes'),
					onPress: (): void => {
						wipeKeychain().then();
						dispatch(resetSettings());
						dispatch(resetPubkys());
						navigation.reset({
							index: 0,
							routes: [{ name: 'Onboarding' }],
						});
					},
					style: 'destructive',
				},
			]
		);
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

	return (
		<View style={styles.container}>
			<PubkyRingHeader leftButton={leftButton()} rightButton={rightButton()} />

			<View style={styles.content}>
				{/**
                 TODO: Adjust light-mode gradient colors.
                 <Card style={styles.section}>
                 <ActionButton onPress={handleThemePress} style={styles.themeButton}>
                 <Text style={styles.settingTitle}>Theme</Text>
                 <SessionText style={styles.themeValue}>
                 {themeDisplayText}
                 </SessionText>
                 </ActionButton>
                 </Card>
                 **/}

				<Card style={styles.section}>
					<ActionButton
						onPress={handleNavigationAnimationPress}
						style={styles.navigationAnimationButton}
					>
						<Text style={styles.settingTitle}>{t('settings.navigationAnimation')}</Text>
						<SessionText style={styles.themeValue}>
							{navigationAnimationText}
						</SessionText>
					</ActionButton>
				</Card>

				<Card style={styles.section}>
					<ActionButton
						onPress={handleAutoAuthToggle}
						style={styles.toggleRow}
					>
						<Text style={styles.settingTitle}>{t('settings.autoAuth')}</Text>
						<View style={styles.switchContainer}>
							<Switch
								value={enableAutoAuth}
								onValueChange={handleAutoAuthToggle}
							/>
						</View>
					</ActionButton>
				</Card>

				{showSecretSettings && (
					<Card style={styles.section}>
						<ActionButton
							onPress={handleShowOnboarding}
							style={styles.navigationAnimationButton}
						>
							<Text style={styles.settingTitle}>{t('settings.showOnboarding')}</Text>
						</ActionButton>
					</Card>
				)}

				{showSecretSettings && (
					<Card style={styles.section}>
						<ActionButton
							onPress={handleWipePubkyRing}
							style={styles.navigationAnimationButton}
						>
							<Text style={styles.settingTitle}>{t('settings.wipePubkyRing')}</Text>
						</ActionButton>
					</Card>
				)}

				{/* Backup all pubkys */}
				{/* TODO: Consider implementing a "Backup All Pubkys" feature. Backs up all pubkys with same passphrase and saves as zip file for future import
				<Card style={styles.section}>
					<ActionButton
						onPress={handleBackupPress}
						style={styles.backupButton}
					>
						<Text style={styles.settingTitle}>Backup All Pubkys</Text>
					</ActionButton>
				</Card>
				*/}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	rightNavButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	},
	section: {
		marginBottom: 16,
		borderRadius: 16,
		overflow: 'hidden',
	},
	settingTitle: {
		fontSize: 17,
		fontWeight: '600',
	},
	switchContainer: {
		justifyContent: 'center',
	},
	// eslint-disable-next-line react-native/no-unused-styles
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
		width: '100%',
	},
	themeValue: {
		fontSize: 15,
	},
	toggleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		height: 60,
		width: '100%',
	},
});

export default memo(SettingsScreen);
