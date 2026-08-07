import { combineReducers, configureStore, Middleware } from '@reduxjs/toolkit';
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
	version: 7,
	transforms: [pubkyTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const summarizeReduxState = (state: RootReducerState) => ({
	pubky: {
		pubkyCount: Object.keys(state.pubky.pubkys || {}).length,
		homeserverCount: Object.keys(state.pubky.homeservers || {}).length,
		processingCount: Object.keys(state.pubky.processing || {}).length,
		hasDeepLink: Boolean(state.pubky.deepLink),
	},
	settings: state.settings,
	ui: state.ui,
});

const reduxDebugLogger: Middleware = storeApi => next => action => {
	const result = next(action);
	const actionType =
		typeof action === 'object' && action !== null && 'type' in action
			? String(action.type)
			: 'unknown';

	console.log('[redux]', actionType, summarizeReduxState(storeApi.getState() as RootReducerState));

	return result;
};

export const store = configureStore({
	reducer: persistedReducer,
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}).concat(__DEV__ ? [reduxDebugLogger] : []),
	devTools: __DEV__ ? { name: 'pubkyring', trace: true, traceLimit: 25 } : false,
});

export const persistor = persistStore(store);

// Type inference
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
