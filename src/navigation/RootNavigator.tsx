import React, { ReactElement } from 'react';
import {
	DefaultTheme,
	NavigationContainer,
} from '@react-navigation/native';
import {
	createNativeStackNavigator,
} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PubkyDetailScreen from '../screens/PubkyDetailScreen';
import {
	RootStackParamList,
} from './types';
import EditPubkyScreen from '../screens/EditPubkyScreen.tsx';
import {
	useTheme,
} from 'styled-components';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): ReactElement => {
	const theme = useTheme();
	return (
		<NavigationContainer theme={{ ...DefaultTheme, ...theme }}>
			<Stack.Navigator
				initialRouteName="Home"
				screenOptions={{
					headerShown: false,
					animation: 'slide_from_right',
					animationDuration: 200,
				}}
			>
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
