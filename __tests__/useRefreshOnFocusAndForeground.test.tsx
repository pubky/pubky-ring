import type { EffectCallback } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useRefreshOnFocusAndForeground } from '../src/hooks/useRefreshOnFocusAndForeground';

let mockIsFocused = true;

jest.mock('@react-navigation/native', () => ({
	useFocusEffect: (effect: EffectCallback) => {
		const ReactMock = require('react');
		ReactMock.useEffect(() => (mockIsFocused ? effect() : undefined), [effect, mockIsFocused]);
	},
}));

describe('useRefreshOnFocusAndForeground', () => {
	const listeners = new Set<(state: AppStateStatus) => void>();
	const changeAppState = (state: AppStateStatus): void => {
		act(() => {
			listeners.forEach(listener => listener(state));
		});
	};

	beforeEach(() => {
		mockIsFocused = true;
		listeners.clear();
		AppState.currentState = 'active';
		jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
			listeners.add(listener);
			return { remove: () => listeners.delete(listener) };
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('refreshes after returning from a requesting app without navigating away', () => {
		const refresh = jest.fn();
		renderHook(() => useRefreshOnFocusAndForeground(refresh));
		expect(refresh).toHaveBeenCalledTimes(1);

		changeAppState('inactive');
		changeAppState('background');
		expect(refresh).toHaveBeenCalledTimes(1);

		changeAppState('active');
		expect(refresh).toHaveBeenCalledTimes(2);
	});

	it('does not refresh for duplicate active events', () => {
		const refresh = jest.fn();
		renderHook(() => useRefreshOnFocusAndForeground(refresh));

		changeAppState('active');
		changeAppState('active');
		expect(refresh).toHaveBeenCalledTimes(1);
	});

	it('only refreshes the focused screen and reloads when it regains focus', () => {
		const refresh = jest.fn();
		const { rerender } = renderHook(() => useRefreshOnFocusAndForeground(refresh));

		mockIsFocused = false;
		rerender({});
		expect(listeners.size).toBe(0);
		changeAppState('background');
		changeAppState('active');
		expect(refresh).toHaveBeenCalledTimes(1);

		mockIsFocused = true;
		rerender({});
		expect(refresh).toHaveBeenCalledTimes(2);
		expect(listeners.size).toBe(1);
	});

	it('removes the foreground listener when unmounted', () => {
		const refresh = jest.fn();
		const { unmount } = renderHook(() => useRefreshOnFocusAndForeground(refresh));

		unmount();
		expect(listeners.size).toBe(0);
		changeAppState('background');
		changeAppState('active');
		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
