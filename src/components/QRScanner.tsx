import React, { memo, ReactElement, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNQRGenerator from 'rn-qr-generator';
import MigrationProgressOverlay from './MigrationProgressOverlay';
import Button from './Button.tsx';
import Sheet from './Sheet.tsx';
import Camera from './Camera/Camera.tsx';
import { useTranslation } from 'react-i18next';
import { Flashlight, Image as ImageIcon, Qrcode } from '../icons/index.ts';
import IconButton from './IconButton.tsx';
import { showToast } from '../utils/helpers.ts';

interface QRScannerProps {
	title?: string;
	onScan: (data: string) => Promise<void> | void;
	onCopyClipboard: () => Promise<void>;
	onClose?: () => void;
}

const QRScanner = ({ payload }: { payload: QRScannerProps }): ReactElement => {
	const { t } = useTranslation();
	const { onScan, onCopyClipboard, onClose, title = t('auth.authorize') } = payload;
	const [torchMode, setTorchMode] = useState(false);
	const [isProcessingImage, setIsProcessingImage] = useState(false);

	const handlePickImage = useCallback(async (): Promise<void> => {
		if (isProcessingImage) {
			return;
		}

		setIsProcessingImage(true);

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
			await onScan(values[0]);
		} catch (error) {
			setIsProcessingImage(false);
			console.error('Failed to pick QR image:', error);
			showToast({
				type: 'error',
				title: t('common.error'),
				description: t('scanner.imageDecodeError'),
			});
		}
	}, [isProcessingImage, onScan, t]);

	const handleToggleTorch = useCallback((): void => {
		setTorchMode(prevTorchMode => !prevTorchMode);
	}, []);

	return (
		<Sheet id="camera" title={title} onClose={onClose}>
			<View style={styles.cameraContainer}>
				<Camera torchMode={torchMode} onBarCodeRead={onScan}>
					<View style={styles.actionsRow}>
						<IconButton
							disabled={isProcessingImage}
							icon={isProcessingImage ? <ActivityIndicator color="#ffffff" /> : <ImageIcon />}
							onPress={handlePickImage}
						/>
						<IconButton active={torchMode} icon={<Flashlight />} onPress={handleToggleTorch} />
					</View>
				</Camera>
				<MigrationProgressOverlay />
			</View>
			<View style={styles.buttonContainer}>
				<Button
					text={t('clipboard.pasteLink')}
					size="large"
					icon={<Qrcode size={24} />}
					onPress={onCopyClipboard}
				/>
			</View>
		</Sheet>
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

export default memo(QRScanner);
