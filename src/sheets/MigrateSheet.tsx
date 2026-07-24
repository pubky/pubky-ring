import React, { memo, ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SheetFrame } from '../components/Sheet.tsx';
import MigrateQRCode from '../screens/MigrateQRCode.tsx';
import MigrateScanner from '../screens/MigrateScanner.tsx';
import type { MigrateStackParamList } from './types.ts';

const Stack = createNativeStackNavigator<MigrateStackParamList>();

const MigrateSheet = (): ReactElement => {
	return (
		<SheetFrame>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="QRCode" component={MigrateQRCode} />
				<Stack.Screen name="Scanner" component={MigrateScanner} />
			</Stack.Navigator>
		</SheetFrame>
	);
};

export default memo(MigrateSheet);
