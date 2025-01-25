import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Camera from './Camera/Camera';
import ScanningOverlay from './Camera/ScanningOverlay';
import { ActionSheetContainer, Clipboard, Text } from '../theme/components.ts';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import { CardButton } from '../theme/components.ts';
interface QRScannerProps {
	onScan: (data: string) => void;
	onCopyClipboard: () => Promise<string>;
	onClose: () => void;
}

const QRScanner = memo(({ payload }: { payload: QRScannerProps }) => {
	const { onScan, onCopyClipboard, onClose } = payload;
	const navigationAnimation = useSelector(getNavigationAnimation);

	const handleBarCodeRead = useCallback((data: string) => {
		onScan(data);
	}, [onScan]);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="camera"
				animated={true}
				onClose={onClose}
				navigationAnimation={navigationAnimation}
			>
				<View style={styles.cameraContainer}>
					<Camera onBarCodeRead={handleBarCodeRead} />
					<ScanningOverlay />
					<View style={styles.buttonContainer}>
						<CardButton
							style={styles.actionButton2}
							onPress={onCopyClipboard}
						>
							<Clipboard size={16} />
							<Text style={styles.buttonText}>Paste</Text>
						</CardButton>
					</View>
				</View>
			</ActionSheetContainer>
		</View>
	);
});

const styles = StyleSheet.create({
	// TODO: Eventially remove the absolute positioned container View.
	// It only exists because the ActionSheetContainer does not work well with the DraggableFlatList component.
	container: {
		...absoluteFillObject,
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	cameraContainer: {
		height: '96%',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	buttonContainer: {
		position: 'absolute',
		bottom: 20,
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 100,
	},
	actionButton2: {
		borderRadius: 64,
		paddingVertical: 15,
		paddingHorizontal: 24,
		alignItems: 'center',
		justifyContent: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 8,
		width: 160,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		alignSelf: 'center',
	},
});

export default memo(QRScanner);
