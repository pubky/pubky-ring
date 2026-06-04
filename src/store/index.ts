import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
	createMigrate,
	createTransform,
	FLUSH,
	PAUSE,
	PERSIST,
	PersistConfig,
	Persistor,
	persistReducer,
	persistStore,
	PURGE,
	REGISTER,
	REHYDRATE,
} from 'redux-persist';
import { initReduxStorage, reduxStorage } from './mmkv-storage';
import pubkyReducer from './slices/pubkysSlice.ts';
import { initialState as pubkyInitialState } from './shapes/pubky';
import settingsReducer from './slices/settingsSlice.ts';
import uiReducer from './slices/uiSlice.ts';
import migrations from './migrations';

const rootReducer = combineReducers({
	pubky: pubkyReducer,
	settings: settingsReducer,
	ui: uiReducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;
type PubkySliceState = typeof pubkyInitialState;

const pubkyTransform = createTransform<PubkySliceState, PubkySliceState>(
	inboundState => inboundState,
	outboundState => ({
		...pubkyInitialState,
		...outboundState,
		deepLink: pubkyInitialState.deepLink,
		processing: { ...pubkyInitialState.processing },
	}),
	{ whitelist: ['pubky'] },
);

const persistConfig: PersistConfig<RootReducerState> = {
	key: 'root',
	storage: reduxStorage,
	whitelist: ['pubky', 'settings'],
	migrate: createMigrate(migrations),
	version: 6,
	transforms: [pubkyTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
	devTools: __DEV__ ? { name: 'pubkyring', trace: true, traceLimit: 25 } : false,
});

let persistorInstance: Persistor | null = null;

/**
 * Initialises the encrypted MMKV storage and creates the persistor. Must be
 * awaited (e.g. at app boot) before rendering PersistGate, because the
 * encryption key is read asynchronously from the secure keystore.
 */
export const initializeStore = async (): Promise<Persistor> => {
	if (persistorInstance) {
		return persistorInstance;
	}
	await initReduxStorage();
	persistorInstance = persistStore(store);
	return persistorInstance;
};

// Type inference
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
