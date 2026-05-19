import React, { ReactElement, useMemo } from 'react';
import { DefaultTheme, NavigationContainer, type Theme as NavigationTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { useTranslation } from 'react-i18next';
import { DISABLE_ANIMATIONS, NAVIGATION_ANIMATION_DURATION } from '../utils/constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): ReactElement => {
	const { t } = useTranslation();
	const showOnboarding = useSelector(getShowOnboarding);
	const signedTermsOfUse = useSelector(getSignedTermsOfUse);
	const navigationAnimation = useSelector(getNavigationAnimation);
	const theme = useTheme();
	const initialRoute = useMemo(() => {
		return !signedTermsOfUse ? 'TermsOfUse' : showOnboarding ? 'Onboarding' : 'Home';
	}, [showOnboarding, signedTermsOfUse]);

	const navTheme: NavigationTheme = useMemo(
		() => ({
			...DefaultTheme,
			colors: {
				...DefaultTheme.colors,
				background: theme.colors.background,
				border: theme.colors.border,
				card: theme.colors.cardBackground,
				primary: theme.colors.textPrimary,
				text: theme.colors.textPrimary,
			},
		}),
		[theme],
	);

	return (
		<NavigationContainer theme={navTheme}>
			<Stack.Navigator
				initialRouteName={initialRoute}
				screenOptions={{
					headerShown: false,
					animation: DISABLE_ANIMATIONS ? 'none' : navigationAnimation,
					animationDuration: NAVIGATION_ANIMATION_DURATION,
				}}
			>
				<Stack.Screen
					name="TermsOfUse"
					component={TermsOfUse}
					options={{
						title: t('screenTitles.termsOfUse'),
						gestureEnabled: false,
					}}
				/>
				<Stack.Screen
					name="Onboarding"
					component={OnboardingScreen}
					options={{
						title: t('screenTitles.onboarding'),
						gestureEnabled: false,
					}}
				/>
				<Stack.Screen
					name="Home"
					component={HomeScreen}
					options={{
						title: t('screenTitles.home'),
						gestureEnabled: false,
						headerBackVisible: false,
					}}
				/>
				<Stack.Screen
					name="About"
					component={About}
					options={{
						title: t('screenTitles.about'),
						gestureEnabled: true,
					}}
				/>
				<Stack.Screen
					name="Settings"
					component={SettingsScreen}
					options={{
						title: t('screenTitles.settings'),
						gestureEnabled: true,
					}}
				/>
				<Stack.Screen
					name="PubkyDetail"
					component={PubkyDetailScreen}
					options={{
						title: t('screenTitles.pubkyDetail'),
						gestureEnabled: true,
					}}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default RootNavigator;
