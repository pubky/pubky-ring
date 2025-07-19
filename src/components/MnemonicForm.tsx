import React, {
	memo,
	ReactElement,
	useCallback,
	useState,
	useRef,
	useMemo,
	useEffect,
} from 'react';
import {
	StyleSheet,
	NativeSyntheticEvent,
	TextInputKeyPressEventData,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import * as bip39 from 'bip39';
import {
	View,
	Text,
	SessionText,
	NavButton,
	ArrowLeft,
	TextInput,
} from '../theme/components.ts';
import { ScrollView } from 'react-native';
import Button from '../components/Button.tsx';
import ModalIndicator from './ModalIndicator.tsx';
import { Result } from '@synonymdev/result';

interface MnemonicFormProps {
	onBack: () => void;
	onCancel: () => void;
	onImport: (mnemonicPhrase: string) => Promise<Result<string>>
}

const MnemonicForm = ({ onBack, onCancel, onImport }: MnemonicFormProps): ReactElement => {
	const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(''));
	const [validWords, setValidWords] = useState<boolean[]>(Array(12).fill(true));
	const [focused, setFocused] = useState<number | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const inputRefs = useRef<(typeof TextInput)[]>(Array(12).fill(null));

	// Auto-focus first input when component mounts
	useEffect(() => {
		// Small delay to ensure the component is fully rendered
		const timer = setTimeout(() => {
			inputRefs.current[0]?.focus();
		}, 100);

		return (): void => clearTimeout(timer);
	}, []);

	// BIP39 word validation using official wordlist
	const isValidWord = useCallback((word: string): boolean => {
		if (!word) {return true;} // Allow empty words

		// Remove number prefix if it exists for validation
		const cleanWord = word.replace(/^\d+\.\s*/, '').toLowerCase().trim();
		if (!cleanWord) {return true;}

		// Validate against official BIP39 English wordlist
		return bip39.wordlists.english.includes(cleanWord);
	}, []);

	const enableImport = useMemo(() => {
		const hasAllWords = !mnemonicWords.includes('') && mnemonicWords.every(word => word.length > 0);
		const allWordsValid = validWords.every(valid => valid);
		return hasAllWords && allWordsValid;
	}, [mnemonicWords, validWords]);

	const updateMnemonicWord = useCallback((index: number, text: string) => {
		text = text.trim();

		// Detect if user pastes whole seed in any input
		if (text.split(' ').length === 12) {
			const words = text.split(' ').map(w => w.toLowerCase());
			setMnemonicWords(words);
			setValidWords(words.map(word => isValidWord(word)));
			Keyboard.dismiss();
			return;
		}

		// Remove the number prefix if it exists (e.g., "1. word" -> "word")
		const numberPrefix = `${index + 1}. `;
		let word = text.startsWith(numberPrefix) ? text.substring(numberPrefix.length) : text;

		// If the text is just the number prefix (e.g., "7."), treat as empty
		if (text === numberPrefix.trim() || text === `${index + 1}.`) {
			word = '';
		}

		// Check if we're transitioning from having text to being empty
		const previousWord = mnemonicWords[index];
		const wasNotEmpty = previousWord && previousWord.length > 0;
		const isNowEmpty = !word || word.length === 0;

		setMnemonicWords(prev => {
			const newWords = [...prev];
			newWords[index] = word.toLowerCase();
			return newWords;
		});

		// If field just became empty due to deletion and we have a previous input, focus it
		if (wasNotEmpty && isNowEmpty && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	}, [isValidWord, mnemonicWords]);

	const getDisplayValue = useCallback((index: number) => {
		const word = mnemonicWords[index];
		if (!word) {return '';}

		// Check if the word already starts with the number prefix
		const expectedPrefix = `${index + 1}. `;
		if (word.startsWith(expectedPrefix)) {
			return word; // Already has the prefix
		}

		return `${index + 1}. ${word}`;
	}, [mnemonicWords]);

	const handleFocus = useCallback((index: number) => {
		setFocused(index);
	}, []);

	const handleBlur = useCallback((index: number) => {
		setFocused(null);
		// Validate word when user leaves the input (like reference code)
		setValidWords(prev => {
			const newValidWords = [...prev];
			const word = mnemonicWords[index];
			// Only validate if word has content, otherwise keep as valid
			newValidWords[index] = !word || isValidWord(word);
			return newValidWords;
		});
	}, [isValidWord, mnemonicWords]);

	const handleImport = useCallback(async () => {
		try {
			setLoading(true);
			if (enableImport) {
				// Clean the words: remove any number prefixes and extra whitespace
				const cleanedWords = mnemonicWords.map(word => {
					// Remove number prefix if present (e.g., "1. word" -> "word")
					return word.replace(/^\d+\.\s*/, '').toLowerCase().trim();
				});

				// Join the cleaned words into a single string separated by spaces
				const mnemonicPhrase = cleanedWords.join(' ');

				// Pass the mnemonic phrase string
				await onImport(mnemonicPhrase);
			}
		} finally {
			setLoading(false);
		}
	}, [mnemonicWords, onImport, enableImport]);

	const handleSubmitEditing = useCallback(() => {
		if (focused === null || focused > 10) {
			// Last input or invalid focus
			if (enableImport) {
				handleImport();
			}
			return;
		}
		inputRefs.current[focused + 1]?.focus();
	}, [focused, enableImport, handleImport]);

	const handleKeyPress = useCallback(({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
		if (nativeEvent.key !== 'Backspace' || focused === null || mnemonicWords[focused]) {
			return;
		}
		// If backspace is pressed on empty field, move to previous input
		if (focused > 0) {
			inputRefs.current[focused - 1]?.focus();
		}
	}, [focused, mnemonicWords]);

	const handleCancel = useCallback(() => {
		setMnemonicWords(Array(12).fill(''));
		setValidWords(Array(12).fill(true));
		setFocused(null);
		onCancel();
	}, [onCancel]);

	const renderBackButton = useCallback(() => (
		<NavButton
			style={styles.backButton}
			onPressIn={onBack}
			hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
		>
			<ArrowLeft size={24} />
		</NavButton>
	), [onBack]);

	return (
		<KeyboardAvoidingView
			style={styles.scrollViewWrapper}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
		>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
				bounces={false}
			>
				<ModalIndicator />
				<View style={styles.titleContainer}>
					{renderBackButton()}
					<Text style={styles.title}>Import Pubky</Text>
				</View>
				<SessionText style={styles.message}>
					Enter your pubky recovery phrase.
				</SessionText>
				<View style={styles.keyContainer}>
					<View style={styles.mnemonicGrid}>
						<View style={styles.mnemonicColumn}>
							{Array.from({ length: 6 }, (_, index) => {
								const isInvalid = mnemonicWords[index] && !validWords[index];
								return (
									<TextInput
										key={index}
										ref={(ref) => { inputRefs.current[index] = ref; }}
										style={[
											styles.mnemonicInput,
											isInvalid && styles.invalidInput,
											loading && styles.disabledInput,
										]}
										value={getDisplayValue(index)}
										onChangeText={(text) => updateMnemonicWord(index, text)}
										onFocus={() => handleFocus(index)}
										onBlur={() => handleBlur(index)}
										onSubmitEditing={handleSubmitEditing}
										onKeyPress={handleKeyPress}
										placeholder={`${index + 1}.`}
										placeholderTextColor="#666"
										autoCapitalize="none"
										autoCorrect={false}
										secureTextEntry={false}
										returnKeyType={index === 11 ? 'done' : 'next'}
										blurOnSubmit={false}
										editable={!loading}
									/>
								);
							})}
						</View>
						<View style={styles.mnemonicColumn}>
							{Array.from({ length: 6 }, (_, index) => {
								const actualIndex = index + 6;
								const isInvalid = mnemonicWords[actualIndex] && !validWords[actualIndex];
								return (
									<TextInput
										key={actualIndex}
										ref={(ref) => { inputRefs.current[actualIndex] = ref; }}
										style={[
											styles.mnemonicInput,
											isInvalid && styles.invalidInput,
											loading && styles.disabledInput,
										]}
										value={getDisplayValue(actualIndex)}
										onChangeText={(text) => updateMnemonicWord(actualIndex, text)}
										onFocus={() => handleFocus(actualIndex)}
										onBlur={() => handleBlur(actualIndex)}
										onSubmitEditing={handleSubmitEditing}
										onKeyPress={handleKeyPress}
										placeholder={`${actualIndex + 1}.`}
										placeholderTextColor="#666"
										autoCapitalize="none"
										autoCorrect={false}
										secureTextEntry={false}
										returnKeyType={actualIndex === 11 ? 'done' : 'next'}
										blurOnSubmit={false}
										editable={!loading}
									/>
								);
							})}
						</View>
					</View>
				</View>
				<View style={styles.buttonContainer}>
					<Button
						text="Cancel"
						style={[styles.button, styles.cancelButton]}
						textStyle={styles.buttonText}
						onPress={handleCancel}
					/>
					<Button
						text="Import Pubky"
						style={[styles.button, styles.importButton]}
						textStyle={styles.buttonText}
						onPress={handleImport}
						loading={loading}
						disabled={!enableImport}
					/>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	scrollContent: {
		flexGrow: 1,
		backgroundColor: 'transparent',
		justifyContent: 'space-between',
	},
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		backgroundColor: 'transparent',
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
		alignSelf: 'center',
		minHeight: 44,
		textAlign: 'center',
	},
	keyContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'flex-start',
		paddingBottom: 20,
	},
	buttonContainer: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		alignSelf: 'center',
		justifyContent: 'space-around',
		gap: 12,
		backgroundColor: 'transparent',
	},
	button: {
		width: '47%',
		minHeight: 64,
	},
	importButton: {
		borderWidth: 1,
	},
	cancelButton: {
	},
	buttonText: {
		fontSize: 15,
		fontWeight: '600',
		lineHeight: 18,
	},
	backButton: {
		position: 'absolute',
		left: 20,
		zIndex: 10,
		backgroundColor: 'transparent',
	},
	mnemonicGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		backgroundColor: 'transparent',
	},
	mnemonicColumn: {
		width: '48%',
		backgroundColor: 'transparent',
	},
	mnemonicInput: {
		borderWidth: 1,
		borderColor: '#444',
		borderStyle: 'dashed',
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
		fontSize: 17,
		fontWeight: 400,
		lineHeight: 22,
		minHeight: 42,
		marginBottom: 8,
		backgroundColor: 'transparent',
	},
	invalidInput: {
		borderColor: '#ff4444',
		color: '#ff4444',
	},
	disabledInput: {
		opacity: 0.8,
		color: '#666',
	},
	scrollViewWrapper: {
		height: '100%',
		backgroundColor: 'transparent',
		zIndex: 1,
		position: 'relative',
		flex: 1,
		justifyContent: 'space-between',
	},
});

export default memo(MnemonicForm);
