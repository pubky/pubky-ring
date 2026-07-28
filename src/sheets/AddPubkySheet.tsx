import React, { memo, ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SheetFrame } from '../components/Sheet.tsx';
import AddPubkyMain from '../screens/AddPubkyMain.tsx';
import AddPubkyScanner from '../screens/AddPubkyScanner.tsx';
import AddPubkyReview from '../screens/AddPubkyReview.tsx';
import AddPubkyHomeserver from '../screens/AddPubkyHomeserver.tsx';
import AddPubkyInviteCode from '../screens/AddPubkyInviteCode.tsx';
import AddPubkyRequestInvite from '../screens/AddPubkyRequestInvite.tsx';
import AddPubkyImportOptions from '../screens/AddPubkyImportOptions.tsx';
import AddPubkyImportFileScreen from '../screens/AddPubkyImportFileScreen.tsx';
import AddPubkyImportMnemonic from '../screens/AddPubkyImportMnemonic.tsx';
import AddPubkyImportSuccess from '../screens/AddPubkyImportSuccess.tsx';
import AddPubkyLoading from '../screens/AddPubkyLoading.tsx';
import Welcome from '../screens/Welcome.tsx';
import type { AddPubkyStackParamList } from './types.ts';

const Stack = createNativeStackNavigator<AddPubkyStackParamList>();

const AddPubkySheet = (): ReactElement => {
	return (
		<SheetFrame>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Main" component={AddPubkyMain} />
				<Stack.Screen name="Loading" component={AddPubkyLoading} />
				<Stack.Screen name="Scanner" component={AddPubkyScanner} />
				<Stack.Screen name="PubkyReview" component={AddPubkyReview} />
				<Stack.Screen name="Homeserver" component={AddPubkyHomeserver} />
				<Stack.Screen name="InviteCode" component={AddPubkyInviteCode} />
				<Stack.Screen name="RequestInvite" component={AddPubkyRequestInvite} />
				<Stack.Screen name="Welcome" component={Welcome} />
				<Stack.Screen name="ImportOptions" component={AddPubkyImportOptions} />
				<Stack.Screen name="ImportFileScreen" component={AddPubkyImportFileScreen} />
				<Stack.Screen name="ImportMnemonic" component={AddPubkyImportMnemonic} />
				<Stack.Screen name="ImportSuccess" component={AddPubkyImportSuccess} />
			</Stack.Navigator>
		</SheetFrame>
	);
};

export default memo(AddPubkySheet);
