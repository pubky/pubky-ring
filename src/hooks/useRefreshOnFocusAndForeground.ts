import { useCallback } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export const useRefreshOnFocusAndForeground = (refresh: () => void): void => {
	useFocusEffect(
		useCallback(() => {
			let previousState = AppState.currentState;
			refresh();

			const subscription = AppState.addEventListener('change', nextState => {
				const returnedToForeground = nextState === 'active' && previousState !== 'active';
				previousState = nextState;
				if (returnedToForeground) {
					refresh();
				}
			});

			return () => subscription.remove();
		}, [refresh]),
	);
};
