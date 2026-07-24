import React, { ReactElement, useMemo } from 'react';
import { DefaultTheme, NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import PubkyDetailScreen from '../screens/PubkyDetailScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useTheme } from 'styled-components';
import { RootStackParamList } from './types';
import { useSelector } from 'react-redux';
import {
	getNavigationAnimation,
	getShowOnboarding,
	getSignedTermsOfUse,
} from '../store/selectors/settingsSelectors.ts';
import SettingsScreen from '../screens/SettingsScreen.tsx';
import TermsOfUse from '../screens/TermsOfUse.tsx';
import About from '../screens/About.tsx';
import { NAVIGATION_ANIMATION_DURATION } from '../utils/constants';
import { useReducedMotion } from '../hooks/useReducedMotion.ts';
import { flushPendingSheetNavigation, navigationRef } from '../sheets/sheetNavigation.tsx';
import { getSheetDetent } from '../sheets/sheetLayout.ts';
import BackupSheet from '../sheets/BackupSheet.tsx';
import AuthSheet from '../sheets/AuthSheet.tsx';
import DeletePubkySheet from '../sheets/DeletePubkySheet.tsx';
import EditPubkySheet from '../sheets/EditPubkySheet.tsx';
import AddPubkySheet from '../sheets/AddPubkySheet.tsx';
import MigrateSheet from '../sheets/MigrateSheet.tsx';
import LegacySunsetSheet from '../sheets/LegacySunsetSheet.tsx';
import { useDeepLinkHandler } from '../hooks/useDeepLinkHandler.ts';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): ReactElement => {
	const { height: windowHeight } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const showOnboarding = useSelector(getShowOnboarding);
	const signedTermsOfUse = useSelector(getSignedTermsOfUse);
	const navigationAnimation = useSelector(getNavigationAnimation);
	const reducedMotionEnabled = useReducedMotion();
	const theme = useTheme();

	useDeepLinkHandler();

	const initialRoute = useMemo(() => {
		return !signedTermsOfUse ? 'TermsOfUse' : showOnboarding ? 'Onboarding' : 'Home';
	}, [showOnboarding, signedTermsOfUse]);

	const fixedSheetDetent = useMemo(() => {
		return getSheetDetent(windowHeight, insets.top, insets.bottom);
	}, [insets.top, insets.bottom, windowHeight]);

	const sheetScreenOptions: NativeStackNavigationOptions = useMemo(
		() => ({
			presentation: 'formSheet',
			sheetAllowedDetents: [fixedSheetDetent],
			sheetCornerRadius: 32,
			sheetExpandsWhenScrolledToEdge: false,
			contentStyle: {
				backgroundColor: '#000000',
			},
		}),
		[fixedSheetDetent],
	);

	const navTheme: NavigationTheme = useMemo(
		() => ({
			...DefaultTheme,
			colors: {
				...DefaultTheme.colors,
				background: theme.colors.background,
				primary: theme.colors.textPrimary,
				text: theme.colors.textPrimary,
			},
		}),
		[theme],
	);

	return (
		<NavigationContainer ref={navigationRef} theme={navTheme} onReady={flushPendingSheetNavigation}>
			<Stack.Navigator
				initialRouteName={initialRoute}
				screenOptions={{
					headerShown: false,
					animation: reducedMotionEnabled ? 'none' : navigationAnimation,
					animationDuration: reducedMotionEnabled ? 0 : NAVIGATION_ANIMATION_DURATION,
				}}
			>
				<Stack.Screen name="TermsOfUse" component={TermsOfUse} />
				<Stack.Screen name="Onboarding" component={OnboardingScreen} />
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen name="PubkyDetail" component={PubkyDetailScreen} />
				<Stack.Screen name="About" component={About} />
				<Stack.Screen name="Settings" component={SettingsScreen} />
				<Stack.Screen name="AddPubkySheet" component={AddPubkySheet} options={sheetScreenOptions} />
				<Stack.Screen name="EditPubkySheet" component={EditPubkySheet} options={sheetScreenOptions} />
				<Stack.Screen name="DeletePubkySheet" component={DeletePubkySheet} options={sheetScreenOptions} />
				<Stack.Screen name="AuthSheet" component={AuthSheet} options={sheetScreenOptions} />
				<Stack.Screen name="BackupSheet" component={BackupSheet} options={sheetScreenOptions} />
				<Stack.Screen name="MigrateSheet" component={MigrateSheet} options={sheetScreenOptions} />
				<Stack.Screen name="LegacySunsetSheet" component={LegacySunsetSheet} options={sheetScreenOptions} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default RootNavigator;
