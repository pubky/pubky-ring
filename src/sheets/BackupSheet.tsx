import React, { memo, ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SheetFrame } from '../components/Sheet.tsx';
import BackupPreferenceScreen from '../screens/BackupPreferenceScreen.tsx';
import BackupFileScreen from '../screens/BackupFileScreen.tsx';
import RecoveryPhraseScreen from '../screens/RecoveryPhraseScreen.tsx';
import type { BackupStackParamList } from './types.ts';

const Stack = createNativeStackNavigator<BackupStackParamList>();

const BackupSheet = (): ReactElement => {
	return (
		<SheetFrame>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="BackupPreferenceScreen" component={BackupPreferenceScreen} />
				<Stack.Screen name="BackupFileScreen" component={BackupFileScreen} />
				<Stack.Screen name="RecoveryPhraseScreen" component={RecoveryPhraseScreen} />
			</Stack.Navigator>
		</SheetFrame>
	);
};

export default memo(BackupSheet);
