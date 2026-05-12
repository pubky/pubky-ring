import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Camera from './Camera/Camera';
import { ActionSheetContainer, Clipboard, Text } from '../theme/components.ts';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import { ACTION_SHEET_HEIGHT, SMALL_SCREEN_ACTION_SHEET_HEIGHT } from '../utils/constants.ts';
import { isSmallScreen } from '../utils/helpers.ts';
import i18n from '../i18n';
import MigrationProgressOverlay from './MigrationProgressOverlay';
import { textStyles } from '../theme/utils';
import Button from './Button.tsx';

interface QRScannerProps {
	onScan: (data: string) => void;
	onCopyClipboard: () => Promise<string>;
	onClose: () => void;
	title?: string;
}

const smallScreen = isSmallScreen();
const actionSheetHeight = smallScreen ? SMALL_SCREEN_ACTION_SHEET_HEIGHT : ACTION_SHEET_HEIGHT;

const QRScanner = memo(({ payload }: { payload: QRScannerProps }) => {
	const { onScan, onCopyClipboard, onClose, title = i18n.t('auth.authorize') } = payload;
	const navigationAnimation = useSelector(getNavigationAnimation);

	const handleBarCodeRead = useCallback(
		(data: string) => {
			onScan(data);
		},
		[onScan],
	);

	return (
		<ActionSheetContainer
			id="camera"
			animated={true}
			onClose={onClose}
			navigationAnimation={navigationAnimation}
			height={actionSheetHeight}
		>
			<View style={styles.container}>
				<Text style={styles.title}>{title}</Text>
				<View style={styles.cameraContainer}>
					<Camera onBarCodeRead={handleBarCodeRead} />
					<MigrationProgressOverlay />
				</View>
				<View style={styles.buttonContainer}>
					<Button
						text={i18n.t('clipboard.pasteLink')}
						size="large"
						icon={<Clipboard size={20} />}
						onPress={onCopyClipboard}
					/>
				</View>
			</View>
		</ActionSheetContainer>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginHorizontal: 24,
	},
	cameraContainer: {
		flex: 1,
		width: '100%',
	},
	title: {
		...textStyles.bodyMB,
		alignSelf: 'center',
		marginBottom: 16,
	},
	buttonContainer: {
		marginTop: 24,
		marginBottom: 24,
	},
});

export default memo(QRScanner);
