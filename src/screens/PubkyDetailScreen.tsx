import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { Image, StyleSheet } from 'react-native';
import { PubkyData } from '../navigation/types';
import PubkyDetail from '../components/PubkyDetail/PubkyDetail.tsx';
import { useSelector, useDispatch } from 'react-redux';
import { getPubky } from '../store/selectors/pubkySelectors.ts';
import { RootState } from '../store';
import {
	NavButton,
	View,
	ArrowLeft,
} from '../theme/components.ts';
import PubkyRingHeader from '../components/PubkyRingHeader';
import { Dispatch } from 'redux';
import { useTypedNavigation, useTypedRoute } from '../navigation/hooks';
import { showEditPubkySheet } from "../utils/sheetHelpers.ts";
import { SheetManager } from 'react-native-actions-sheet';
import { parseInput } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';
import { readFromClipboard, copyToClipboard } from '../utils/clipboard';
import { showToast, checkNetworkConnection } from '../utils/helpers';
import { getIsOnline } from '../utils/store-helpers';
import i18n from '../i18n';

const PubkyDetailScreen = (): ReactElement => {
	const navigation = useTypedNavigation();
	const route = useTypedRoute<'PubkyDetail'>();
	const dispatch = useDispatch();
	const { pubky, index } = route.params;
	const data = useSelector((state: RootState) => getPubky(state, pubky));

	const pubkyData: PubkyData = useMemo(() => {
		return { ...data, pubky };
	}, [data, pubky]);

	const onRightButtonPress = useCallback(() => {
		showEditPubkySheet({
			title: data.signedUp ? i18n.t('common.edit') : i18n.t('pubky.setup'),
			pubky,
		});
	}, [data, pubky]);

	const leftButton = useCallback(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={navigation.goBack}
			hitSlop={{ top: 20,
				bottom: 20,
				left: 20,
				right: 20 }}
		>
			<ArrowLeft size={24} />
		</NavButton>
	), [navigation]);

	const rightButton = useCallback(() => (
		<NavButton
			style={styles.navButton}
			onPressIn={onRightButtonPress}
			hitSlop={{ top: 10,
				bottom: 10,
				left: 10,
				right: 10 }}
		>
			<Image
				source={require('../images/pencil.png')}
				style={styles.pencilIcon}
			/>
		</NavButton>
	), [onRightButtonPress]);

	const handleQRPress = useCallback(async (qrData: {
        pubky: string;
        dispatch: Dispatch;
        onComplete?: () => void;
    }): Promise<string> => {
		const { pubky: targetPubky, onComplete } = qrData;

		// Check network before showing scanner
		const isOnline = getIsOnline();
		if (!isOnline) {
			const connected = await checkNetworkConnection({
				prevNetworkState: isOnline,
				dispatch,
				displayToastIfOnline: false,
				displayToastIfOffline: false,
			});
			if (!connected) {
				showToast({
					type: 'error',
					title: i18n.t('network.currentlyOffline'),
					description: i18n.t('network.offlineDescription'),
					autoHide: false,
				});
				return '';
			}
		}

		return new Promise<string>((resolve) => {
			SheetManager.show('camera', {
				payload: {
					onScan: async (scannedData: string) => {
						await SheetManager.hide('camera');
						const parsed = await parseInput(scannedData, 'scan');
						const result = await routeInput(parsed, { dispatch, pubky: targetPubky });
						if (result.isErr()) {
							const debugInfo = JSON.stringify({
								error: result.error.message,
								input: scannedData.substring(0, 100),
								action: parsed.action,
							}, null, 2);
							showToast({
								type: 'error',
								title: i18n.t('common.error'),
								description: result.error.message,
								onPress: () => {
									copyToClipboard(debugInfo);
									showToast({
										type: 'success',
										title: i18n.t('common.copied'),
										description: i18n.t('errors.debugInfoCopied'),
									});
								},
							});
						}
						onComplete?.();
						resolve(result.isOk() ? scannedData : result.error.message);
					},
					onCopyClipboard: async (): Promise<void> => {
						await SheetManager.hide('camera');
						const clipboardContents = await readFromClipboard();
						if (!clipboardContents) {
							showToast({
								type: 'error',
								title: i18n.t('common.error'),
								description: i18n.t('errors.emptyClipboard'),
							});
							resolve('');
							return;
						}
						const parsed = await parseInput(clipboardContents, 'clipboard');
						const result = await routeInput(parsed, { dispatch, pubky: targetPubky });
						if (result.isErr()) {
							const debugInfo = JSON.stringify({
								error: result.error.message,
								input: clipboardContents.substring(0, 100),
								action: parsed.action,
							}, null, 2);
							showToast({
								type: 'error',
								title: i18n.t('common.error'),
								description: result.error.message,
								onPress: () => {
									copyToClipboard(debugInfo);
									showToast({
										type: 'success',
										title: i18n.t('common.copied'),
										description: i18n.t('errors.debugInfoCopied'),
									});
								},
							});
						}
						onComplete?.();
						resolve(result.isOk() ? clipboardContents : result.error.message);
					},
					onClose: () => {
						SheetManager.hide('camera');
						resolve('');
					},
				},
			});
		});
	}, [dispatch]);

	return (
		<View style={styles.container}>
			<PubkyRingHeader
				leftButton={leftButton()}
				rightButton={rightButton()}
			/>
			<PubkyDetail
				index={index}
				pubkyData={pubkyData}
				onQRPress={handleQRPress}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	navButton: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	},
	pencilIcon: {
		width: 24,
		height: 24,
		alignSelf: 'center',
	},
});

export default memo(PubkyDetailScreen);
