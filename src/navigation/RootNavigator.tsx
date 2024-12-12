import React, {ReactElement, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import PubkyDetailScreen from '../screens/PubkyDetailScreen';
import EditPubkyScreen from '../screens/EditPubkyScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoadingScreen from '../screens/LoadingScreen'; // Importa la pagina di attesa
import {useTheme} from 'styled-components';
import {RootStackParamList} from './types';
import ConfirmPubkyScreen from '../screens/ConfirmPubky';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): ReactElement => {
  const theme = useTheme();
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem(
          'hasSeenOnboarding',
        );
        if (hasSeenOnboarding === 'true') {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setInitialRoute('Home');
      }
    };

    checkOnboarding();
  }, []);

  if (!initialRoute) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={{...DefaultTheme, ...theme}}>
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
