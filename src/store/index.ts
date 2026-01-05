import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
	createMigrate,
	FLUSH,
	PAUSE,
	PERSIST,
	persistReducer,
	persistStore,
	PURGE,
	REGISTER,
	REHYDRATE,
} from 'redux-persist';
import { reduxStorage } from './mmkv-storage';
import pubkyReducer from './slices/pubkysSlice.ts';
import settingsReducer from './slices/settingsSlice.ts';
import uiReducer from './slices/uiSlice.ts';
import migrations from './migrations';

// TODO: Add a transform to clear transient state (deepLink, processing) on rehydration.
// Example:
// const pubkyTransform = createTransform(
//   (inboundState: PubkyState) => inboundState,
//   (outboundState: PubkyState) => ({ ...outboundState, deepLink: '', processing: {} }),
//   { whitelist: ['pubky'] }
// );
// Then add `transforms: [pubkyTransform]` to persistConfig.
const persistConfig = {
	key: 'root',
	storage: reduxStorage,
	whitelist: ['pubky', 'settings'],
	migrate: createMigrate(migrations),
	version: 6,
};

const rootReducer = combineReducers({
	pubky: pubkyReducer,
	settings: settingsReducer,
	ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);


export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
	devTools: {
		name: 'pubkyring',
		trace: true,
		traceLimit: 25,
	},
});

export const persistor = persistStore(store);

// Type inference
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
