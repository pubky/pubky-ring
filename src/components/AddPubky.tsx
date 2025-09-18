import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import {
	Image,
	Platform,
	StyleSheet,
} from 'react-native';
import {
	View,
	Text,
	ActionSheetContainer,
	SessionText,
	RadialGradient,
	NavButton,
	ArrowLeft,
	AuthorizeButton,
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import { useSelector, useDispatch } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import ModalIndicator from './ModalIndicator.tsx';
import MnemonicForm from './MnemonicForm.tsx';
import {
	ACTION_SHEET_HEIGHT,
	BLUE_RADIAL_GRADIENT,
} from '../utils/constants.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import { Result } from '@synonymdev/result';
import { toastConfig } from '../theme/toastConfig.tsx';
import Toast from 'react-native-toast-message';
import {
	getToastStyle,
	showImportQRScanner,
} from '../utils/helpers.ts';
import { SCANNER_CLOSE_DELAY } from '../utils/constants.ts';

const toastStyle = getToastStyle();


const AddPubky = ({ payload }: {
	payload: {
		createPubky: () => void;
		importPubky: (mnemonic?: string) => Promise<Result<string>>;
	};
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
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

	const onMnemonicBack = useCallback(() => {
		setCurrentScreen('import-options');
	}, []);

	const goBack = useCallback(() => {
		if (currentScreen === 'import-options') {
			setCurrentScreen('main');
		} else if (currentScreen === 'mnemonic-form') {
			setCurrentScreen('import-options');
		}
	}, [currentScreen]);

	const onScanQrPress = useCallback(async () => {
		await closeSheet();
		setTimeout(async () => {
			await showImportQRScanner({
				dispatch,
				onComplete: () => {}
			});
		}, SCANNER_CLOSE_DELAY);
	}, [closeSheet, dispatch]);

	const renderBackButton = useCallback(() => (
		<NavButton
			style={styles.backButton}
			onPressIn={goBack}
			hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
		>
			<ArrowLeft size={24} />
		</NavButton>
	), [goBack]);

	const titleText = useMemo(() => {
		switch (currentScreen) {
			case 'main':
				return 'Add Pubky';
			case 'import-options':
				return 'Import Pubky';
			case 'mnemonic-form':
				return 'Import Pubky';
			default:
				return 'Add Pubky';
		}
	}, [currentScreen]);

	const getImage = useCallback(() => {
		switch (currentScreen) {
			case 'import-options':
				return (
					<Image
						source={require('../images/import-pubky.png')}
						style={styles.importImage}
					/>
				);
			default:
				return (
					<Image
						source={require('../images/add-pubky-key.png')}
						style={styles.keyImage}
					/>
				);
		}
	}, [currentScreen]);

	const getHeaderText = useCallback(() => {
		switch (currentScreen) {
			case 'main':
				return (
					<Text style={styles.headerText}>{'Your keys,\nyou identity.'}</Text>
				);
			case 'import-options':
				return (
					<Text style={styles.headerText}>{'Restore or\nimport pubky.'}</Text>
				);
			default:
				return <></>;
		}
	}, [currentScreen]);

	const messageText: string = useMemo(() => {
		switch (currentScreen) {
			case 'main':
				return 'Do you want to create a new pubky or import an existing one?';
			case 'import-options':
				return 'Choose the backup method you used.';
			case 'mnemonic-form':
				return (
					'Enter the 12 words from your recovery \n' +
          'phrase to import or restore your pubky.'
				);
			default:
				return 'Do you want to create a new pubky or import an existing one?';
		}
	}, [currentScreen]);

	const getButtonConfig = useCallback(() => {
		switch (currentScreen) {
			case 'main':
				return [
					{ id: 'ImportPubkyButton', text: 'Import pubky', onPress: onImportPubky, style: styles.importButton },
					{ id: 'NewPubkyButton', text: 'New pubky', onPress: onCreatePubky, style: styles.createButton },
				];
			case 'import-options':
				return [
					{ id: 'EncryptedFileButton', text: 'Encrypted File', onPress: onUploadFile, style: styles.importButton },
					{ id: 'RecoveryPhraseButton', text: 'Recovery Phrase', onPress: onMnemonicPhrase, style: styles.importButton },
				];
			case 'mnemonic-form':
				return [];
			default:
				return [];
		}
	}, [currentScreen, onCreatePubky, onImportPubky, onMnemonicPhrase, onUploadFile]);

	const shouldShowBackButton = useMemo(() => {
		return currentScreen === 'import-options';
	}, [currentScreen]);

	const getContent = useCallback(() => {
		if (currentScreen === 'mnemonic-form') {
			return (
				<MnemonicForm
					onBack={onMnemonicBack}
					onCancel={onMnemonicCancel}
					onImport={importPubky}
				/>
			);
		}

		return (
			<>
				<ModalIndicator />
				<View style={styles.titleContainer}>
					{shouldShowBackButton && renderBackButton()}
					<Text style={styles.title}>{titleText}</Text>
				</View>
				{getHeaderText()}
				<SessionText style={styles.message}>
					{messageText}
				</SessionText>
				<View style={styles.keyContainer}>
					{getImage()}
				</View>
				<View style={styles.buttonContainer}>
					{getButtonConfig().map((button: { id?: string; text: string; style: any; onPress: (() => void) | undefined; }, index: React.Key | null | undefined) => (
						<Button
							testID={button.id}
							key={index}
							text={button.text}
							style={[styles.button, button.style]}
							textStyle={styles.buttonText}
							onPress={button.onPress}
						/>
					))}
				</View>
				{currentScreen === 'import-options' &&
				<AuthorizeButton
          	style={styles.authorizeButton}
          	onPressIn={onScanQrPress}
				>
					<Text style={styles.buttonText}>Scan QR to import</Text>
				</AuthorizeButton>}
			</>
		);
	}, [currentScreen, getButtonConfig, getHeaderText, getImage, importPubky, messageText, onMnemonicBack, onMnemonicCancel, onScanQrPress, renderBackButton, shouldShowBackButton, titleText]);

	return (
		<View style={styles.container}>
			<ActionSheetContainer
				id="add-pubky"
				navigationAnimation={navigationAnimation}
				keyboardHandlerEnabled={Platform.OS === 'ios'}
				//isModal={Platform.OS === 'ios'}
				CustomHeaderComponent={<></>}
				height={ACTION_SHEET_HEIGHT}
			>
				<RadialGradient
					style={styles.content}
					colors={BLUE_RADIAL_GRADIENT}
					center={{ x: 0.5, y: 0.5 }}
				>
					{getContent()}
				</RadialGradient>
				<Toast config={toastConfig({ style: toastStyle })} />
			</ActionSheetContainer>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...absoluteFillObject,
		backgroundColor: 'transparent',
		height: '100%',
		width: '100%',
		zIndex: 100,
	},
	content: {
		paddingHorizontal: 20,
		borderTopRightRadius: 20,
		borderTopLeftRadius: 20,
		height: '98%',
	},
	keyContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'center',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	headerText: {
		fontSize: 48,
		lineHeight: 48,
		fontWeight: '700',
		marginBottom: 20,
	},
	title: {
		fontSize: 17,
		fontWeight: '700',
		lineHeight: 22,
		letterSpacing: 0.4,
		textAlign: 'center',
		textTransform: 'capitalize',
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
	message: {
		fontWeight: '400',
		fontSize: 17,
		lineHeight: 22,
		minHeight: 44,
	},
	buttonContainer: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		alignSelf: 'center',
		justifyContent: 'space-around',
		gap: 12,
		paddingVertical: 12,
		backgroundColor: 'transparent',
		marginBottom: 10,
	},
	button: {
		width: '47%',
		minHeight: 64,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	importButton: {
	},
	createButton: {
		borderWidth: 1,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
	},
	importImage: {
		width: 279,
		height: 279,
		alignSelf: 'center',
	},
	keyImage: {
		width: 350,
		height: 350,
		alignSelf: 'center',
	},
	backButton: {
		position: 'absolute',
		left: 20,
		zIndex: 10,
		backgroundColor: 'transparent',
	},
	authorizeButton: {
		width: '100%',
		borderRadius: 64,
		paddingVertical: 20,
		alignItems: 'center',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
		alignSelf: 'center',
		alignContent: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
});

export default memo(AddPubky);
