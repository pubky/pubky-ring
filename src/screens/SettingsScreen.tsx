import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { StyleSheet, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import {
	View,
	Text,
	ChevronLeft,
	NavButton,
	Card,
	ActionButton,
	SessionText,
} from '../theme/components.ts';
import PubkyRingHeader from '../components/PubkyRingHeader..tsx';
import { useDispatch, useSelector } from 'react-redux';
import { getAutoAuth, getTheme } from '../store/selectors/settingsSelectors.ts';
import { setTheme } from '../theme/helpers.ts';
import { ETheme } from '../types/settings.ts';
import { updateAutoAuth } from '../store/slices/settingsSlice.ts';

type Props = NativeStackScreenProps<RootStackParamList, 'EditPubky'>;

const SettingsScreen = ({ navigation }: Props): ReactElement => {
	const dispatch = useDispatch();
	const currentTheme = useSelector(getTheme);
	const autoAuth = useSelector(getAutoAuth);
	const [enableAutoAuth, setEnableAutoAuth] = useState(autoAuth);

	const leftButton = useCallback(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={navigation.goBack}
		>
			<ChevronLeft size={16} />
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
					<View style={styles.toggleRow}>
						<Text style={styles.settingTitle}>Auto Auth</Text>
						<Switch
							value={enableAutoAuth}
							onValueChange={handleAutoAuthToggle}
						/>
					</View>
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
		width: 32,
		height: 32,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
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
		width: '100%',
	},
	themeValue: {
		fontSize: 15,
	},
	toggleRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
	},
});

export default memo(SettingsScreen);
