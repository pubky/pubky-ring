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
import migrations from './migrations';

const persistConfig = {
	key: 'root',
	storage: reduxStorage,
	whitelist: ['pubky', 'settings'],
	migrate: createMigrate(migrations),
	version: 2,
};

const rootReducer = combineReducers({
	pubky: pubkyReducer,
	settings: settingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const logger = __DEV__
  ? require('redux-logger').createLogger({
  	collapsed: true,
  })
  : null;

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) => {
		const middleware = getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		});
		return __DEV__ ? middleware.concat(logger) : middleware;
	},
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
