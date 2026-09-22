import React, { memo, ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SheetFrame } from '../components/Sheet.tsx';
import AuthScanner from '../screens/AuthScanner.tsx';
import SelectPubky from '../screens/SelectPubky.tsx';
import ConfirmAuth from '../screens/ConfirmAuth.tsx';
import type { AuthStackParamList } from './types.ts';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthSheet = (): ReactElement => {
	return (
		<SheetFrame>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Scanner" component={AuthScanner} />
				<Stack.Screen name="SelectPubky" component={SelectPubky} />
				<Stack.Screen name="ConfirmAuth" component={ConfirmAuth} />
			</Stack.Navigator>
		</SheetFrame>
	);
};

export default memo(AuthSheet);
