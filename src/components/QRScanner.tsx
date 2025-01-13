import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Camera from './Camera/Camera';
import ScanningOverlay from './Camera/ScanningOverlay';
import { ActionSheetContainer } from '../theme/components.ts';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;

interface QRScannerProps {
	onScan: (data: string) => void;
	onClose: () => void;
}

const QRScanner = memo(({ payload }: { payload: QRScannerProps }) => {
	const { onScan, onClose } = payload;
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
});

export default memo(QRScanner);
