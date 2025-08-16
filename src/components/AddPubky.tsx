import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import {
	Dimensions,
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
} from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { SheetManager } from 'react-native-actions-sheet';
import { useSelector } from 'react-redux';
import { getNavigationAnimation } from '../store/selectors/settingsSelectors.ts';
import ModalIndicator from './ModalIndicator.tsx';
import MnemonicForm from './MnemonicForm.tsx';
import { AUTHORIZE_KEY_GRADIENT } from '../utils/constants.ts';
import absoluteFillObject = StyleSheet.absoluteFillObject;
import { Result } from '@synonymdev/result';
import { toastConfig } from '../theme/toastConfig.tsx';
import Toast from 'react-native-toast-message';

const ACTION_SHEET_HEIGHT = Platform.OS === 'ios' ? '95%' : '100%';
const { height } = Dimensions.get('window');
const isSmallScreen = height < 700;
const toastStyle = {
	top: Platform.select({
		ios: isSmallScreen ? -9 : -50,
		android: isSmallScreen ? -9 : -50,
	}),
};


const AddPubky = ({ payload }: {
	payload: {
		createPubky: () => void;
		importPubky: (mnemonic?: string) => Promise<Result<string>>;
	};
}): ReactElement => {
	const navigationAnimation = useSelector(getNavigationAnimation);
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
			}, 100);
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
		const txt = 'Restore or\nimport pubky.';
		switch (currentScreen) {
			case 'import-options':
				return (
					<Text style={styles.headerText}>{txt}</Text>
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
				return 'Enter your pubky recovery phrase.';
			default:
				return 'Do you want to create a new pubky or import an existing one?';
		}
	}, [currentScreen]);

	const getButtonConfig = useCallback(() => {
		switch (currentScreen) {
			case 'main':
				return [
					{ text: 'Import pubky', onPress: onImportPubky, style: styles.importButton },
					{ text: 'New pubky', onPress: onCreatePubky, style: styles.createButton },
				];
			case 'import-options':
				return [
					{ text: 'Encrypted File', onPress: onUploadFile, style: styles.importButton },
					{ text: 'Recovery Phrase', onPress: onMnemonicPhrase, style: styles.importButton },
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
					{getButtonConfig().map((button: { text: string; style: any; onPress: (() => void) | undefined; }, index: React.Key | null | undefined) => (
						<Button
							key={index}
							text={button.text}
							style={[styles.button, button.style]}
							textStyle={styles.buttonText}
							onPress={button.onPress}
						/>
					))}
				</View>
			</>
		);
	}, [currentScreen, getButtonConfig, getHeaderText, getImage, importPubky, messageText, onMnemonicBack, onMnemonicCancel, renderBackButton, shouldShowBackButton, titleText]);

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
					colors={AUTHORIZE_KEY_GRADIENT}
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
		marginBottom: 20,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'center',
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
	},
	button: {
		width: '47%',
		minHeight: 64,
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
});

export default memo(AddPubky);
