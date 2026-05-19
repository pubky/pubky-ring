import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import MigrationProgressOverlay from './MigrationProgressOverlay';
import Button from './Button.tsx';
import Sheet from './Sheet.tsx';
import Camera from './Camera/Camera.tsx';
import { useTranslation } from 'react-i18next';
import { Qrcode } from '../icons/index.ts';

interface QRScannerProps {
	title?: string;
	onScan: (data: string) => void;
	onCopyClipboard: () => Promise<void>;
	onClose?: () => void;
}

const QRScanner = ({ payload }: { payload: QRScannerProps }): ReactElement => {
	const { t } = useTranslation();
	const { onScan, onCopyClipboard, onClose, title = t('auth.authorize') } = payload;

	return (
		<Sheet id="camera" title={title} onClose={onClose}>
			<View style={styles.cameraContainer}>
				<Camera onBarCodeRead={onScan} />
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
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 24,
	},
});

export default memo(QRScanner);
