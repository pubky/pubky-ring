import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import { showToast } from '@synonymdev/react-native-toast';
import QRScannerContent from '../src/components/QRScannerContent';
import { SCAN_SLOW_WARNING_MS } from '../src/components/Camera/scanGate';

let mockOnBarCodeRead: (data: string) => void = () => {};

jest.mock('../src/components/Camera/Camera.tsx', () => {
	const ReactMock = require('react');
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: ({
			children,
			onBarCodeRead,
		}: {
			children?: React.ReactNode;
			onBarCodeRead: (data: string) => void;
		}) => {
			mockOnBarCodeRead = onBarCodeRead;
			return ReactMock.createElement(View, null, children);
		},
	};
});

jest.mock('../src/components/IconButton.tsx', () => {
	const ReactMock = require('react');
	const { Pressable } = require('react-native');

	return {
		__esModule: true,
		default: ({ disabled, testID, onPress }: { disabled?: boolean; testID?: string; onPress?: () => void }) =>
			ReactMock.createElement(Pressable, {
				disabled,
				testID,
				onPress,
				accessibilityState: { disabled: !!disabled },
			}),
	};
});

jest.mock('../src/components/Button.tsx', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/MigrationProgressOverlay.tsx', () => ({
	__esModule: true,
	default: () => null,
}));
jest.mock('../src/icons/index.ts', () => ({
	__esModule: true,
	Flashlight: () => null,
	Image: () => null,
	Qrcode: () => null,
}));

jest.mock('react-native-image-picker', () => ({
	__esModule: true,
	launchImageLibrary: jest.fn(),
}));

jest.mock('rn-qr-generator', () => ({
	__esModule: true,
	default: { detect: jest.fn() },
}));

jest.mock('react-i18next', () => ({
	__esModule: true,
	useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@synonymdev/react-native-toast', () => ({
	__esModule: true,
	showToast: jest.fn(),
}));

const launchImageLibraryMock = launchImageLibrary as jest.Mock;
const detectMock = RNQRGenerator.detect as jest.Mock;
const showToastMock = showToast as jest.Mock;

const deferred = (): { promise: Promise<void>; resolve: () => void } => {
	let resolve: () => void = () => {};
	const promise = new Promise<void>(res => {
		resolve = res;
	});
	return { promise, resolve };
};

const renderScanner = (onScan: jest.Mock): ReturnType<typeof render> =>
	render(<QRScannerContent onScan={onScan} onCopyClipboard={jest.fn(async () => {})} />);

describe('QRScannerContent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		launchImageLibraryMock.mockResolvedValue({ assets: [{ uri: 'file://qr.png' }] });
		detectMock.mockResolvedValue({ values: ['pubkyauth://picked'] });
	});

	it('disables the gallery button until a camera scan settles, even past the slow-scan warning', async () => {
		jest.useFakeTimers();
		jest.spyOn(console, 'warn').mockImplementation(() => {});
		const scan = deferred();
		const screen = renderScanner(jest.fn(() => scan.promise));
		const galleryButton = (): ReturnType<typeof screen.getByTestId> =>
			screen.getByTestId('QRScannerGalleryButton');

		expect(galleryButton()).toBeEnabled();
		act(() => mockOnBarCodeRead('pubkyauth://camera'));
		act(() => {
			jest.advanceTimersByTime(SCAN_SLOW_WARNING_MS * 2);
		});
		expect(galleryButton()).toBeDisabled();

		await act(async () => {
			scan.resolve();
			await scan.promise;
		});
		expect(galleryButton()).toBeEnabled();

		jest.restoreAllMocks();
		jest.useRealTimers();
	});

	it('shows a toast when a pick loses the race with a camera scan', async () => {
		const scan = deferred();
		const onScan = jest.fn(() => scan.promise);
		const picker = deferred();
		launchImageLibraryMock.mockImplementation(async () => {
			await picker.promise;
			return { assets: [{ uri: 'file://qr.png' }] };
		});
		const screen = renderScanner(onScan);

		fireEvent.press(screen.getByTestId('QRScannerGalleryButton'));
		// The camera handles a code while the picker is still open.
		act(() => mockOnBarCodeRead('pubkyauth://camera'));

		await act(async () => {
			picker.resolve();
			await picker.promise;
		});

		expect(onScan.mock.calls).toEqual([['pubkyauth://camera']]);
		expect(showToastMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'info',
				title: 'scanner.scanInProgressTitle',
				description: 'scanner.scanInProgressDescription',
			}),
		);

		await act(async () => {
			scan.resolve();
			await scan.promise;
		});
	});

	it('handles a picked code once, even if the camera then reads it', async () => {
		const onScan = jest.fn();
		const screen = renderScanner(onScan);

		await act(async () => {
			fireEvent.press(screen.getByTestId('QRScannerGalleryButton'));
		});
		act(() => mockOnBarCodeRead('pubkyauth://picked'));

		expect(onScan.mock.calls).toEqual([['pubkyauth://picked']]);
		expect(showToastMock).not.toHaveBeenCalled();
	});
});
