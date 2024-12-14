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
	getShowOnboarding,
} from '../store/selectors/settingsSelectors.ts';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): ReactElement => {
	const showOnboarding = useSelector(getShowOnboarding);
	const theme = useTheme();
	const initialRoute = useMemo(() => {
		return showOnboarding ? 'Onboarding' : 'Home';
	}, [showOnboarding]);

	return (
		<NavigationContainer theme={{ ...DefaultTheme, ...theme }}>
			<Stack.Navigator
				initialRouteName={initialRoute}
				screenOptions={{
					headerShown: false,
					animation: 'slide_from_right',
					animationDuration: 200,
				}}>
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
