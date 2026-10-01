import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
	createMigrate,
	createTransform,
	FLUSH,
	PAUSE,
	PERSIST,
	PersistConfig,
	persistReducer,
	persistStore,
	PURGE,
	REGISTER,
	REHYDRATE,
} from 'redux-persist';
import { reduxStorage } from './mmkv-storage';
import pubkyReducer from './slices/pubkysSlice.ts';
import { initialState as pubkyInitialState } from './shapes/pubky';
import settingsReducer from './slices/settingsSlice.ts';
import uiReducer from './slices/uiSlice.ts';
import migrations from './migrations';
import { sanitizePubkySessions } from './transforms/pubkyPersistence';
import authorizedGrantsReducer from './slices/authorizedGrantsSlice.ts';
import type { AuthorizedGrantsState } from './slices/authorizedGrantsSlice.ts';
import { persistAuthorizedGrantCounts } from './transforms/authorizedGrantsPersistence.ts';

const rootReducer = combineReducers({
	pubky: pubkyReducer,
	settings: settingsReducer,
	ui: uiReducer,
	authorizedGrants: authorizedGrantsReducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;
type PubkySliceState = typeof pubkyInitialState;

const pubkyTransform = createTransform<PubkySliceState, PubkySliceState>(
	inboundState => sanitizePubkySessions(inboundState),
	outboundState => ({
		...pubkyInitialState,
		...outboundState,
		deepLink: pubkyInitialState.deepLink,
		processing: { ...pubkyInitialState.processing },
	}),
	{ whitelist: ['pubky'] },
);

const authorizedGrantsTransform = createTransform<AuthorizedGrantsState, AuthorizedGrantsState>(
	persistAuthorizedGrantCounts,
	persistAuthorizedGrantCounts,
	{ whitelist: ['authorizedGrants'] },
);

const persistConfig: PersistConfig<RootReducerState> = {
	key: 'root',
	storage: reduxStorage,
	whitelist: ['pubky', 'settings', 'authorizedGrants'],
	migrate: createMigrate(migrations),
	version: 9,
	transforms: [pubkyTransform, authorizedGrantsTransform],
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

export const persistor = persistStore(store);

// Type inference
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
