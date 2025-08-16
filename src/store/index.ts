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
	version: 4,
};

const rootReducer = combineReducers({
	pubky: pubkyReducer,
	settings: settingsReducer,
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
