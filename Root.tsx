import React, { ReactElement, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import type { Persistor } from 'redux-persist';
import { store, initializeStore } from './src/store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens, enableFreeze } from 'react-native-screens';
import './src/i18n';
import App from './App';

enableScreens(true);
enableFreeze(true);

const rootStyle = { flex: 1 } as const;

function Root(): ReactElement {
	// The persistor is created asynchronously because the MMKV encryption key is
	// read from the secure keystore at boot. Render nothing until it is ready.
	const [persistor, setPersistor] = useState<Persistor | null>(null);

	useEffect(() => {
		initializeStore().then(setPersistor).catch(console.error);
	}, []);

	if (!persistor) {
		return (
			<Provider store={store}>
				<GestureHandlerRootView style={rootStyle} />
			</Provider>
		);
	}

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
