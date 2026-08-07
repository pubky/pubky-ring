import React, { memo, ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SheetFrame } from '../components/Sheet.tsx';
import EditPubkyMain from '../screens/EditPubkyMain.tsx';
import EditPubkySelectServer from '../screens/EditPubkySelectServer.tsx';
import EditPubkyAddServer from '../screens/EditPubkyAddServer.tsx';
import EditPubkyEditServer from '../screens/EditPubkyEditServer.tsx';
import { EditPubkyFlowProvider } from '../components/EditPubky/EditPubkyFlowContext.tsx';
import type { RootStackParamList } from '../navigation/types.ts';
import type { EditPubkyStackParamList } from './types.ts';

const Stack = createNativeStackNavigator<EditPubkyStackParamList>();

const EditPubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'EditPubkySheet'>): ReactElement => {
	return (
		<SheetFrame>
			<EditPubkyFlowProvider>
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name="Main" component={EditPubkyMain} initialParams={route.params} />
					<Stack.Screen name="SelectServer" component={EditPubkySelectServer} />
					<Stack.Screen name="AddServer" component={EditPubkyAddServer} />
					<Stack.Screen name="EditServer" component={EditPubkyEditServer} />
				</Stack.Navigator>
			</EditPubkyFlowProvider>
		</SheetFrame>
	);
};

export default memo(EditPubkySheet);
