import React, { memo, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Camera from './Camera/Camera';
import { ActionSheetContainer, Clipboard, Text } from '../theme/components.ts';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { CardButton } from '../theme/components.ts';
import { ACTION_SHEET_HEIGHT } from '../utils/constants.ts';
interface QRScannerProps {
	onScan: (data: string) => void;
	onCopyClipboard: () => Promise<string>;
	onClose: () => void;
  title?: string;
}

const QRScanner = memo(({ payload }: { payload: QRScannerProps }) => {
	const { onScan, onCopyClipboard, onClose, title = 'Authorize' } = payload;
	const navigationAnimation = useSelector(getNavigationAnimation);

	const handleBarCodeRead = useCallback((data: string) => {
		onScan(data);
	}, [onScan]);

	return (
		<ActionSheetContainer
			id="camera"
			animated={true}
			onClose={onClose}
			navigationAnimation={navigationAnimation}
			height={ACTION_SHEET_HEIGHT}
		>
			<View style={styles.container}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.cameraContainer}>
					<Camera onBarCodeRead={handleBarCodeRead} />
				</View>
				<View style={styles.buttonContainer}>
					<CardButton
						style={styles.actionButton2}
						onPress={onCopyClipboard}
					>
						<Clipboard size={20} style={styles.clipboard} />
						<Text style={styles.buttonText}>Paste Link</Text>
					</CardButton>
				</View>
			</View>
		</ActionSheetContainer>
	);
});

const styles = StyleSheet.create({
	container: {
		height: '100%',
		width: '100%',
	},
	cameraContainer: {
		height: '81%',
		width: '90%',
		alignSelf: 'center'
	},
	title: {
		fontSize: 17,
		fontWeight: 700,
		lineHeight: 22,
		letterSpacing: 0.4,
		alignSelf: 'center',
		marginBottom: 16,
	},
	buttonContainer: {
		height: '19%',
		alignItems: 'center',
		justifyContent: 'center',
		alignContent: 'center',
		bottom: Platform.select({
			ios: 0,
			android: 20,
		})
	},
	actionButton2: {
		flexDirection: 'row',
		minWidth: 327,
		minHeight: 64,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 15,
		alignContent: 'center',
		justifyContent: 'center',
		gap: 8,
		width: '90%',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 1)',
		backgroundColor: 'rgba(255, 255, 255, 0.1)'
	},
	clipboard: {
		alignSelf: 'center'
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
