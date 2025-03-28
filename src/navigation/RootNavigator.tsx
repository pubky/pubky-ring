import React, { ReactElement, useMemo } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PubkyDetailScreen from '../screens/PubkyDetailScreen';
import EditPubkyScreen from '../screens/EditPubkyScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { useTheme } from 'styled-components';
import { RootStackParamList } from './types';
import ConfirmPubkyScreen from '../screens/ConfirmPubky';
import { useSelector } from 'react-redux';
import {
	getNavigationAnimation,
	getShowOnboarding,
	getSignedTermsOfUse,
} from '../store/selectors/settingsSelectors.ts';
import SettingsScreen from '../screens/SettingsScreen.tsx';
import TermsOfUse from '../screens/TermsOfUse.tsx';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): ReactElement => {
	const showOnboarding = useSelector(getShowOnboarding);
	const signedTermsOfUse = useSelector(getSignedTermsOfUse);
	const navigationAnimation = useSelector(getNavigationAnimation);
	const theme = useTheme();
	const initialRoute = useMemo(() => {
		return !signedTermsOfUse ? 'TermsOfUse' : showOnboarding ? 'Onboarding' : 'Home';
	}, [showOnboarding, signedTermsOfUse]);

	return (
		<NavigationContainer theme={{ ...DefaultTheme, ...theme }}>
			<Stack.Navigator
				initialRouteName={initialRoute}
				screenOptions={{
					headerShown: false,
					animation: navigationAnimation,
					animationDuration: 200,
				}}>
				<Stack.Screen
					name="TermsOfUse"
					component={TermsOfUse}
					options={{
						title: 'Terms of Use',
						gestureEnabled: false,
					}}
				/>
				<Stack.Screen
					name="Onboarding"
					component={OnboardingScreen}
					options={{
						title: 'Welcome',
						gestureEnabled: false,
					}}
				/>
				<Stack.Screen
					name="ConfirmPubky"
					component={ConfirmPubkyScreen}
					options={{
						title: 'Confirm pubky',
						gestureEnabled: false,
					}}
				/>
				<Stack.Screen
					name="Home"
					component={HomeScreen}
					options={{
						title: 'Pubky Ring',
						gestureEnabled: false,
						headerBackVisible: false,
					}}
				/>
				<Stack.Screen
					name="Settings"
					component={SettingsScreen}
					options={{
						title: 'Settings',
						gestureEnabled: true,
					}}
				/>
				<Stack.Screen
					name="PubkyDetail"
					component={PubkyDetailScreen}
					options={{
						title: 'Pubky Details',
						gestureEnabled: true,
					}}
				/>
				<Stack.Screen
					name="EditPubky"
					component={EditPubkyScreen}
					options={{
						title: 'Edit Pubky',
						gestureEnabled: true,
					}}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default RootNavigator;
