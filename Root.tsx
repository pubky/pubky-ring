import React, { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens, enableFreeze } from 'react-native-screens';
import App from './App';

enableScreens(true);
enableFreeze(true);

function Root(): ReactElement {
	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				{/* eslint-disable-next-line react-native/no-inline-styles */}
				<GestureHandlerRootView style={{ flex: 1 }}>
					<App />
				</GestureHandlerRootView>
			</PersistGate>
		</Provider>
	);
}

export default Root;
