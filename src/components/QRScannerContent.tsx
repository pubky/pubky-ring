import React, { ReactElement, useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import { useTranslation } from 'react-i18next';
import { showToast } from '@synonymdev/react-native-toast';
import Button from './Button.tsx';
import Camera from './Camera/Camera.tsx';
import { createScanGate, ScanGate } from './Camera/scanGate.ts';
import IconButton from './IconButton.tsx';
import MigrationProgressOverlay from './MigrationProgressOverlay.tsx';
import { Flashlight, Image as ImageIcon, Qrcode } from '../icons/index.ts';

type QRScannerContentProps = {
	onScan: (data: string) => Promise<void> | void;
	onCopyClipboard: () => Promise<void>;
};

const QRScannerContent = ({ onScan, onCopyClipboard }: QRScannerContentProps): ReactElement => {
	const { t } = useTranslation();
	const [torchMode, setTorchMode] = useState(false);
	const [isProcessingImage, setIsProcessingImage] = useState(false);
	// Shared by camera reads and gallery picks so they never run concurrently.
	const [isScanning, setIsScanning] = useState(false);
	const [scanGate] = useState<ScanGate>(() => createScanGate({ onBusyChange: setIsScanning }));
	// True from the gallery tap until the picked image has been handed to the gate.
	const isPickingRef = useRef(false);

	const handleBarCodeRead = useCallback(
		(data: string): void => {
			// The user chose the gallery: the camera must not take over in the meantime
			// (camera reads also pause or stall while the picker opens and closes).
			if (isPickingRef.current) {
				return;
			}
			scanGate(data, onScan);
		},
		[onScan, scanGate],
	);

	const handlePickImage = useCallback(async (): Promise<void> => {
		if (isProcessingImage || isScanning) {
			return;
		}

		setIsProcessingImage(true);
		isPickingRef.current = true;

		try {
			const result = await launchImageLibrary({
				mediaType: 'photo',
				selectionLimit: 1,
				includeBase64: false,
			});

			if (result.didCancel) {
				setIsProcessingImage(false);
				return;
			}

			if (result.errorCode) {
				console.error('Failed to pick QR image:', result.errorMessage ?? result.errorCode);
				showToast({
					type: 'error',
					title: t('common.error'),
					description: t('scanner.imagePickerError'),
				});
				setIsProcessingImage(false);
				return;
			}

			const image = result.assets?.[0];
			if (!image?.uri) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: t('scanner.imagePickerError'),
				});
				setIsProcessingImage(false);
				return;
			}

			const { values } = await RNQRGenerator.detect({
				uri: image.uri,
			});
			if (!values.length) {
				showToast({
					type: 'error',
					title: t('common.error'),
					description: t('scanner.noQrFound'),
				});
				setIsProcessingImage(false);
				return;
			}

			setIsProcessingImage(false);
			// A pick is deliberate, so it skips the same-code cooldown. It can still lose
			// a race with a camera scan that started just before the gallery was opened.
			const accepted = scanGate(values[0], onScan, { skipCooldown: true });
			if (!accepted) {
				showToast({
					type: 'info',
					title: t('scanner.scanInProgressTitle'),
					description: t('scanner.scanInProgressDescription'),
				});
			}
		} catch (error) {
			setIsProcessingImage(false);
			console.error('Failed to pick QR image:', error);
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('scanner.imageDecodeError'),
			});
		} finally {
			isPickingRef.current = false;
		}
	}, [isProcessingImage, isScanning, onScan, scanGate, t]);

	const handleToggleTorch = useCallback((): void => {
		setTorchMode(prevTorchMode => !prevTorchMode);
	}, []);

	return (
		<>
			<View style={styles.cameraContainer}>
				<Camera torchMode={torchMode} onBarCodeRead={handleBarCodeRead}>
					<View style={styles.actionsRow}>
						<IconButton
							disabled={isProcessingImage || isScanning}
							testID="QRScannerGalleryButton"
							icon={isProcessingImage ? <ActivityIndicator color="#ffffff" /> : <ImageIcon size={20} />}
							onPress={handlePickImage}
						/>
						<IconButton active={torchMode} icon={<Flashlight size={20} />} onPress={handleToggleTorch} />
					</View>
				</Camera>
				<MigrationProgressOverlay />
			</View>
			<View style={styles.buttonContainer}>
				<Button
					text={t('clipboard.pasteLink')}
					variant="secondary"
					size="large"
					icon={<Qrcode />}
					testID="QRScannerPasteButton"
					onPress={onCopyClipboard}
				/>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	cameraContainer: {
		flex: 1,
	},
	actionsRow: {
		position: 'absolute',
		top: 16,
		left: 16,
		right: 16,
		zIndex: 2,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
	},
});

export default QRScannerContent;
