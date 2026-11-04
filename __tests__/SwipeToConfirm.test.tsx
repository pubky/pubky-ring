import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { ThemeProvider } from 'styled-components/native';
import SwipeToConfirm from '../src/components/SwipeToConfirm';
import { darkTheme } from '../src/theme';

jest.mock('react-native-reanimated', () => ({
	__esModule: true,
	default: { View: require('react-native').View, createAnimatedComponent: (component: unknown) => component },
	useSharedValue: (initialValue: unknown) =>
		require('react').useState(() => ({
			value: initialValue,
			get() {
				return this.value;
			},
			set(value: unknown) {
				this.value = value;
			},
		}))[0],
	useAnimatedStyle: () => ({}),
	withSpring: (value: unknown) => value,
	withTiming: (value: unknown) => value,
	clamp: (value: number, min: number, max: number) => Math.min(max, Math.max(min, value)),
	isSharedValue: () => false,
	isWorkletFunction: () => false,
	useHandler: () => ({ context: {} }),
	useEvent: () => jest.fn(),
}));
jest.mock('react-native-worklets', () => ({
	scheduleOnRN: (callback: () => void) => callback(),
	scheduleOnUI: jest.fn(),
}));
jest.mock('../src/components/LinearGradient', () => ({ LinearGradient: require('react-native').View }));
jest.mock('react-native-svg/css', () => ({ LocalSvg: () => null }));

const renderSwipe = (onConfirm: () => Promise<void>, props = {}) => {
	const result = render(
		<GestureHandlerRootView>
			<ThemeProvider theme={darkTheme}>
				<SwipeToConfirm text="Swipe To Authorize" testID="swipe" onConfirm={onConfirm} {...props} />
			</ThemeProvider>
		</GestureHandlerRootView>,
	);
	fireEvent(screen.getByTestId('swipe'), 'layout', { nativeEvent: { layout: { width: 327 } } });
	return result;
};

const swipe = (distance: number, endState: typeof State.END | typeof State.CANCELLED = State.END) => {
	fireGestureHandler(getByGestureTestId('swipe-Pan'), [
		{ state: State.BEGAN, translationX: 0 },
		{ state: State.ACTIVE, translationX: 0 },
		{ state: State.ACTIVE, translationX: distance },
		{ state: endState, translationX: distance },
	]);
};

it('does not authorize from a tap or a partial swipe', async () => {
	const onConfirm = jest.fn(async () => undefined);
	renderSwipe(onConfirm);
	fireEvent.press(screen.getByTestId('swipe'));
	await act(async () => {
		swipe(100);
	});
	expect(onConfirm).not.toHaveBeenCalled();
});

it('does not authorize a canceled gesture even past the threshold', async () => {
	const onConfirm = jest.fn(async () => undefined);
	renderSwipe(onConfirm);
	await act(async () => {
		swipe(240, State.CANCELLED);
	});
	expect(onConfirm).not.toHaveBeenCalled();
});

it('authorizes only once while a completed swipe is being processed', async () => {
	let finish!: () => void;
	const onConfirm = jest.fn(
		() =>
			new Promise<void>(resolve => {
				finish = resolve;
			}),
	);
	renderSwipe(onConfirm);
	await act(async () => {
		swipe(240);
	});
	expect(onConfirm).toHaveBeenCalledTimes(1);
	await act(async () => {
		fireEvent(screen.getByTestId('swipe-Handle'), 'accessibilityTap');
	});
	expect(onConfirm).toHaveBeenCalledTimes(1);
	await act(async () => {
		finish();
	});
	expect(screen.getByTestId('swipe-Handle')).not.toBeDisabled();
});

it('offers an accessible activation and allows retry when processing finishes', async () => {
	const onConfirm = jest.fn(async () => undefined);
	renderSwipe(onConfirm);
	await act(async () => {
		fireEvent(screen.getByTestId('swipe-Handle'), 'accessibilityAction', {
			nativeEvent: { actionName: 'activate' },
		});
	});
	await act(async () => {
		swipe(240);
	});
	expect(onConfirm).toHaveBeenCalledTimes(2);
});

it.each([{ disabled: true }, { loading: true }])(
	'blocks accessibility activation while unavailable (%j)',
	async props => {
		const onConfirm = jest.fn(async () => undefined);
		renderSwipe(onConfirm, props);
		await act(async () => {
			fireEvent(screen.getByTestId('swipe-Handle'), 'accessibilityTap');
		});
		expect(onConfirm).not.toHaveBeenCalled();
	},
);
