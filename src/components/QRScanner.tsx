import React, {
	memo,
	useCallback,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Camera from './Camera/Camera';
import ScanningOverlay from './Camera/ScanningOverlay';
import { ActionSheetContainer } from '../theme/components.ts';

interface QRScannerProps {
	onScan: (data: string) => void;
	onClose: () => void;
}

const openAnimationConfig = {
	tension: 500,
	friction: 50,
	velocity: 0,
};

const QRScanner = memo(({ payload }: { payload: QRScannerProps }) => {
	const { onScan, onClose } = payload;

	const handleBarCodeRead = useCallback((data: string) => {
		onScan(data);
	}, [onScan]);

	return (
		<ActionSheetContainer
			id="camera"
			animated={true}
			onClose={onClose}
			openAnimationConfig={openAnimationConfig}
		>
			<View style={styles.cameraContainer}>
				<Camera onBarCodeRead={handleBarCodeRead} />
				<ScanningOverlay />
			</View>
		</ActionSheetContainer>
	);
});

const styles = StyleSheet.create({
	cameraContainer: {
		height: '96%',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
});

export default memo(QRScanner);
