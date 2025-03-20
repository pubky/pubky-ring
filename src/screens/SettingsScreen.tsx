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
} from '../store/slices/settingsSlice.ts';
import { wipeKeychain } from '../utils/keychain.ts';
import { resetPubkys } from '../store/slices/pubkysSlice.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPubky'>;

const SettingsScreen = ({ navigation }: Props): ReactElement => {
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
			[ETheme.system]: 'System',
			[ETheme.light]: 'Light',
			[ETheme.dark]: 'Dark',
		};
		return themeText[theme] || 'System';
	}, []);

	const themeDisplayText = useMemo(() => getThemeDisplayText(currentTheme), [currentTheme, getThemeDisplayText]);

	const navigationAnimationText = useMemo(() => {
		const animationText = {
			[ENavigationAnimation.slideFromRight]: 'Slide',
			[ENavigationAnimation.fade]: 'Fade',
		};
		return animationText[navigationAnimation] || 'Slide';
	}, [navigationAnimation]);

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
			'Are you sure?',
			'This action will erase all Pubky Ring data and cannot be undone.',
			[
				{
					text: 'No',
					style: 'cancel',
				},
				{
					text: 'Yes',
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
	}, [dispatch, navigation]);

	const handleShowOnboarding = useCallback(() => {
		navigation.reset({
			index: 0,
			routes: [{ name: 'Onboarding' }],
		});
	}, [navigation]);

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
				<Card style={styles.section}>
					<ActionButton onPress={handleThemePress} style={styles.themeButton}>
						<Text style={styles.settingTitle}>Theme</Text>
						<SessionText style={styles.themeValue}>
							{themeDisplayText}
						</SessionText>
					</ActionButton>
				</Card>

				<Card style={styles.section}>
					<ActionButton
						onPress={handleNavigationAnimationPress}
						style={styles.navigationAnimationButton}
					>
						<Text style={styles.settingTitle}>Navigation Animation</Text>
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
						<Text style={styles.settingTitle}>Auto Auth</Text>
						<Switch
							value={enableAutoAuth}
							onValueChange={handleAutoAuthToggle}
						/>
					</ActionButton>
				</Card>

				<Card style={styles.section}>
					<ActionButton
						onPress={handleShowOnboarding}
						style={styles.navigationAnimationButton}
					>
						<Text style={styles.settingTitle}>Show Onboarding</Text>
					</ActionButton>
				</Card>

				<Card style={styles.section}>
					<ActionButton
						onPress={handleWipePubkyRing}
						style={styles.navigationAnimationButton}
					>
						<Text style={styles.settingTitle}>Wipe Pubky Ring</Text>
					</ActionButton>
				</Card>

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
		width: 32,
		height: 32,
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
