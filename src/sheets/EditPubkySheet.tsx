import { useSelector } from 'react-redux';
import { getPreferredHomeserver, getPubky } from '../store/selectors/pubkySelectors';
import type { RootState } from '../types';
import { normalizeHomeserver } from '../utils/homeservers';
import React, { memo, ReactElement } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SheetFrame } from '../components/Sheet.tsx';
import EditPubkyScanner from '../screens/EditPubkyScanner';
import EditPubkyMain from '../screens/EditPubkyMain.tsx';
import EditPubkySelectServer from '../screens/EditPubkySelectServer.tsx';
import { EditPubkyFlowProvider } from '../components/EditPubky/EditPubkyFlowContext.tsx';
import type { RootStackParamList } from '../navigation/types.ts';
import type { EditPubkyStackParamList } from './types.ts';

const Stack = createNativeStackNavigator<EditPubkyStackParamList>();

const EditPubkySheet = ({
	route,
}: NativeStackScreenProps<RootStackParamList, 'EditPubkySheet'>): ReactElement => {
	const pubky = useSelector((state: RootState) => getPubky(state, route.params.pubky));
	const preferredHomeserver = useSelector(getPreferredHomeserver);
	const storedHomeserver = normalizeHomeserver(pubky?.homeserver ?? '') ?? pubky?.homeserver ?? '';
	const initialHomeserver = storedHomeserver || (route.params.justCreated ? preferredHomeserver : '');
	return (
		<SheetFrame>
			<EditPubkyFlowProvider key={route.params.pubky} initialHomeserver={initialHomeserver}>
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name="Main" component={EditPubkyMain} initialParams={route.params} />
					<Stack.Screen name="SelectServer" component={EditPubkySelectServer} />
					<Stack.Screen name="Scanner" component={EditPubkyScanner} />
				</Stack.Navigator>
			</EditPubkyFlowProvider>
		</SheetFrame>
	);
};

export default memo(EditPubkySheet);
