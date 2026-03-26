import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens, enableFreeze } from 'react-native-screens';
import './src/i18n';
import App from './App';

enableScreens(true);
enableFreeze(true);

const rootStyle = { flex: 1 } as const;

function Root(): ReactElement {
	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<GestureHandlerRootView style={rootStyle}>
					<App />
				</GestureHandlerRootView>
			</PersistGate>
		</Provider>
	);
}

export default Root;
