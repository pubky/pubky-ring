import React, { memo, ReactElement, useCallback, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import { useDispatch } from 'react-redux';
import MnemonicForm from './MnemonicForm.tsx';
import { Result } from '@synonymdev/result';
import { showToast } from '../utils/helpers.ts';
import { SCANNER_CLOSE_DELAY } from '../utils/constants.ts';
import { parseInput, InputAction } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';
import { readFromClipboard } from '../utils/clipboard';
import i18n from '../i18n';
import { textStyles } from '../theme/utils';
import Sheet from './Sheet.tsx';

const AddPubky = ({
	payload,
}: {
	payload: {
		createPubky: () => void;
		importPubky: (mnemonic?: string) => Promise<Result<string>>;
	};
}): ReactElement => {
	const dispatch = useDispatch();
	const { createPubky, importPubky } = useMemo(() => payload, [payload]);
	const [currentScreen, setCurrentScreen] = useState<'main' | 'import-options' | 'mnemonic-form'>('main');

	const closeSheet = useCallback(async (): Promise<void> => {
		return SheetManager.hide('add-pubky');
	}, []);

	const onImportPubky = useCallback(() => {
		setCurrentScreen('import-options');
	}, []);

	const onUploadFile = useCallback(async (): Promise<void> => {
		try {
			await closeSheet();
			setTimeout(() => {
				importPubky();
			}, SCANNER_CLOSE_DELAY);
		} catch {}
	}, [importPubky, closeSheet]);

	const onMnemonicPhrase = useCallback(() => {
		setCurrentScreen('mnemonic-form');
	}, []);

	const onCreatePubky = useCallback(() => {
		closeSheet();
		createPubky();
	}, [createPubky, closeSheet]);

	const onMnemonicCancel = useCallback(() => {
		setCurrentScreen('import-options');
	}, []);

	const goBack = useCallback(() => {
		if (currentScreen === 'import-options') {
			setCurrentScreen('main');
		} else if (currentScreen === 'mnemonic-form') {
			setCurrentScreen('import-options');
		}
	}, [currentScreen]);

	const onScanQrPress = useCallback(
		async (title: string) => {
			await closeSheet();
			setTimeout(() => {
				SheetManager.show('camera', {
					payload: {
						title,
						onScan: async (data: string) => {
							await SheetManager.hide('camera');
							const parsed = await parseInput(data, 'scan');

							// Handle signup, import, and invite actions
							if (
								parsed.action === InputAction.Signup ||
								parsed.action === InputAction.Import ||
								parsed.action === InputAction.Invite
							) {
								await routeInput(parsed, { dispatch });
							} else {
								showToast({
									type: 'error',
									title: i18n.t('import.invalidData'),
									description: i18n.t('import.invalidClipboardData'),
								});
							}
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
								return;
							}

							const parsed = await parseInput(clipboardContents, 'clipboard');

							// Handle signup, import, and invite actions
							if (
								parsed.action === InputAction.Signup ||
								parsed.action === InputAction.Import ||
								parsed.action === InputAction.Invite
							) {
								await routeInput(parsed, { dispatch });
							} else {
								showToast({
									type: 'error',
									title: i18n.t('import.invalidData'),
									description: i18n.t('import.invalidClipboardData'),
								});
							}
						},
					},
				});
			}, SCANNER_CLOSE_DELAY);
		},
		[closeSheet, dispatch],
	);

	const sheetTitle = useMemo(() => {
		switch (currentScreen) {
			case 'main':
				return i18n.t('addPubky.title');
			case 'import-options':
				return i18n.t('import.title');
			case 'mnemonic-form':
				return i18n.t('import.title');
			default:
				return i18n.t('addPubky.title');
		}
	}, [currentScreen]);

	const getImage = useCallback(() => {
		switch (currentScreen) {
			case 'import-options':
				return <Image source={require('../images/import-pubky.png')} style={styles.importImage} />;
			default:
				return <Image source={require('../images/add-pubky-key.png')} style={styles.keyImage} />;
		}
	}, [currentScreen]);

	const getHeaderText = useCallback(() => {
		switch (currentScreen) {
			case 'main':
				return <Text style={styles.headerText}>{i18n.t('addPubky.yourKeysYourIdentity')}</Text>;
			case 'import-options':
				return <Text style={styles.headerText}>{i18n.t('addPubky.restoreOrImport')}</Text>;
			default:
				return <></>;
		}
	}, [currentScreen]);

	const messageText: string = useMemo(() => {
		switch (currentScreen) {
			case 'main':
				return i18n.t('addPubky.createOrImportQuestion');
			case 'import-options':
				return i18n.t('addPubky.chooseBackupMethod');
			case 'mnemonic-form':
				return i18n.t('addPubky.enterRecoveryWords');
			default:
				return i18n.t('addPubky.createOrImportQuestion');
		}
	}, [currentScreen]);

	const getButtonConfig = useCallback(() => {
		switch (currentScreen) {
			case 'main':
				return [
					{
						id: 'AddPubkyScan',
						text: i18n.t('addPubky.scanSignupQr'),
						variant: 'secondary',
						onPress: () => onScanQrPress(i18n.t('home.scanQR')),
					},
					{ id: 'NewPubkyButton', text: i18n.t('addPubky.newPubkyButton'), onPress: onCreatePubky },
					{ id: 'ImportPubkyButton', text: i18n.t('addPubky.importPubkyButton'), onPress: onImportPubky },
				];
			case 'import-options':
				return [
					{ id: 'EncryptedFileButton', text: i18n.t('backup.encryptedFile'), onPress: onUploadFile },
					{ id: 'RecoveryPhraseButton', text: i18n.t('backup.recoveryPhrase'), onPress: onMnemonicPhrase },
					{
						id: 'ScanQrButton',
						text: i18n.t('addPubky.scanQrToImport'),
						onPress: () => onScanQrPress(i18n.t('import.title')),
					},
				];
			case 'mnemonic-form':
				return [];
			default:
				return [];
		}
	}, [currentScreen, onCreatePubky, onImportPubky, onMnemonicPhrase, onUploadFile]);

	const shouldShowBackButton = currentScreen !== 'main';

	const getContent = useCallback(() => {
		if (currentScreen === 'mnemonic-form') {
			return <MnemonicForm onCancel={onMnemonicCancel} onImport={importPubky} />;
		}

		return (
			<>
				{getHeaderText()}
				<Text style={styles.message}>{messageText}</Text>
				<View style={styles.imageContainer}>{getImage()}</View>
				<View style={styles.buttonContainer}>
					{getButtonConfig().map(
						(
							button: {
								id: string;
								text: string;
								variant?: any;
								style?: any;
								onPress: (() => void) | undefined;
							},
							index: React.Key | null | undefined,
						) => (
							<Button
								key={index}
								testID={button.id}
								text={button.text}
								size="medium"
								style={button.style}
								variant={button.variant}
								onPress={button.onPress}
							/>
						),
					)}
				</View>
			</>
		);
	}, [
		currentScreen,
		getButtonConfig,
		getHeaderText,
		getImage,
		importPubky,
		messageText,
		onMnemonicCancel,
		onScanQrPress,
	]);

	return (
		<Sheet
			id="add-pubky"
			title={sheetTitle}
			gradientType="brand"
			onBackPress={shouldShowBackButton ? goBack : undefined}
		>
			{getContent()}
		</Sheet>
	);
};

const styles = StyleSheet.create({
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	headerText: {
		...textStyles.display,
		marginBottom: 20,
	},
	message: {
		...textStyles.bodyM,
	},
	importImage: {
		width: 200,
		height: 200,
		alignSelf: 'center',
	},
	keyImage: {
		width: 250,
		height: 250,
		alignSelf: 'center',
	},
	buttonContainer: {
		gap: 12,
		marginTop: 'auto',
	},
});

export default memo(AddPubky);
