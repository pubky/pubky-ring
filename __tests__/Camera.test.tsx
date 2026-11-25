import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Camera from '../src/components/Camera/Camera';
import { SCAN_THROTTLE_MS } from '../src/components/Camera/scanGate';

let mockCameraKitProps: Record<string, unknown> | undefined;

jest.mock('react-native-camera-kit', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		CameraType: { Back: 'back', Front: 'front' },
		Camera: (props: Record<string, unknown>) => {
			mockCameraKitProps = props;
			return ReactMock.createElement(View, { testID: 'CameraKit' });
		},
	};
});

jest.mock('../src/utils/permissions', () => ({
	__esModule: true,
	requestCameraPermission: jest.fn(async () => true),
}));

jest.mock('../src/components/Camera/CameraNoAuth', () => ({
	__esModule: true,
	default: () => null,
}));

describe('Camera', () => {
	it('sets the native scan throttle explicitly', async () => {
		const screen = render(<Camera onBarCodeRead={jest.fn()} />);

		await waitFor(() => expect(screen.getByTestId('CameraKit')).toBeTruthy());
		expect(mockCameraKitProps?.scanBarcode).toBe(true);
		expect(mockCameraKitProps?.scanThrottleDelay).toBe(SCAN_THROTTLE_MS);
	});
});
