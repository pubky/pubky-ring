import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens, enableFreeze } from 'react-native-screens';
import './src/sheets/sheets';
import App from './App';

enableScreens(true);
enableFreeze(true);

function Root(): ReactElement {
	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<GestureHandlerRootView>
					<App />
				</GestureHandlerRootView>
			</PersistGate>
		</Provider>
	);
}

export default Root;
