import React, { memo, ReactElement, useCallback, useState, useRef, useMemo, useEffect } from 'react';
import {
	StyleSheet,
	NativeSyntheticEvent,
	TextInput as NativeTextInput,
	TextInputKeyPressEventData,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	View,
} from 'react-native';
import * as bip39 from 'bip39';
import { TextInput, Text } from '../theme/components.ts';
import { ScrollView } from 'react-native';
import Button from '../components/Button.tsx';
import { Result } from '@synonymdev/result';
import i18n from '../i18n';
import { textStyles } from '../theme/utils';

interface MnemonicFormProps {
	onCancel: () => void;
	onImport: (mnemonicPhrase: string) => Promise<Result<string>>;
}

const MnemonicForm = ({ onCancel, onImport }: MnemonicFormProps): ReactElement => {
	const [mnemonicWords, setMnemonicWords] = useState<string[]>(Array(12).fill(''));
	const [validWords, setValidWords] = useState<boolean[]>(Array(12).fill(true));
	const [focused, setFocused] = useState<number | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const inputRefs = useRef<(NativeTextInput | null)[]>(Array(12).fill(null));

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
		if (!word) {
			return true;
		} // Allow empty words

		// Remove number prefix if it exists for validation
		const cleanWord = word
			.replace(/^\d+\.\s*/, '')
			.toLowerCase()
			.trim();
		if (!cleanWord) {
			return true;
		}

		// Validate against official BIP39 English wordlist
		return bip39.wordlists.english.includes(cleanWord);
	}, []);

	const enableImport = useMemo(() => {
		const hasAllWords = !mnemonicWords.includes('') && mnemonicWords.every(word => word.length > 0);
		const allWordsValid = validWords.every(valid => valid);
		return hasAllWords && allWordsValid;
	}, [mnemonicWords, validWords]);

	const updateMnemonicWord = useCallback(
		(index: number, text: string) => {
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
			const isNowEmpty = word?.length === 0;

			setMnemonicWords(prev => {
				const newWords = [...prev];
				newWords[index] = word.toLowerCase();
				return newWords;
			});

			// If field just became empty due to deletion and we have a previous input, focus it
			if (wasNotEmpty && isNowEmpty && index > 0) {
				inputRefs.current[index - 1]?.focus();
			}
		},
		[isValidWord, mnemonicWords],
	);

	const getDisplayValue = useCallback(
		(index: number) => {
			const word = mnemonicWords[index];
			if (!word) {
				return '';
			}

			// Check if the word already starts with the number prefix
			const expectedPrefix = `${index + 1}. `;
			if (word.startsWith(expectedPrefix)) {
				return word; // Already has the prefix
			}

			return `${index + 1}. ${word}`;
		},
		[mnemonicWords],
	);

	const handleFocus = useCallback((index: number) => {
		setFocused(index);
	}, []);

	const handleBlur = useCallback(
		(index: number) => {
			setFocused(null);
			// Validate word when user leaves the input (like reference code)
			setValidWords(prev => {
				const newValidWords = [...prev];
				const word = mnemonicWords[index];
				// Only validate if word has content, otherwise keep as valid
				newValidWords[index] = !word || isValidWord(word);
				return newValidWords;
			});
		},
		[isValidWord, mnemonicWords],
	);

	const handleImport = useCallback(async () => {
		try {
			setLoading(true);
			if (enableImport) {
				// Clean the words: remove any number prefixes and extra whitespace
				const cleanedWords = mnemonicWords.map(word => {
					// Remove number prefix if present (e.g., "1. word" -> "word")
					return word
						.replace(/^\d+\.\s*/, '')
						.toLowerCase()
						.trim();
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

	const handleKeyPress = useCallback(
		({ nativeEvent }: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
			if (nativeEvent.key !== 'Backspace' || focused === null || mnemonicWords[focused]) {
				return;
			}
			// If backspace is pressed on empty field, move to previous input
			if (focused > 0) {
				inputRefs.current[focused - 1]?.focus();
			}
		},
		[focused, mnemonicWords],
	);

	const handleCancel = useCallback(() => {
		setMnemonicWords(Array(12).fill(''));
		setValidWords(Array(12).fill(true));
		setFocused(null);
		onCancel();
	}, [onCancel]);

	const renderMnemonicInput = (index: number): ReactElement => {
		const isInvalid = mnemonicWords[index] && !validWords[index];

		return (
			<TextInput
				key={index}
				// @ts-ignore
				ref={ref => {
					inputRefs.current[index] = ref;
				}}
				style={[styles.mnemonicInput, isInvalid && styles.invalidInput, loading && styles.disabledInput]}
				value={getDisplayValue(index)}
				onChangeText={text => updateMnemonicWord(index, text)}
				onFocus={() => handleFocus(index)}
				onBlur={() => handleBlur(index)}
				onSubmitEditing={handleSubmitEditing}
				onKeyPress={handleKeyPress}
				placeholder={`${index + 1}.`}
				placeholderTextColor="#666"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="off"
				textContentType="none"
				importantForAutofill="no"
				spellCheck={false}
				secureTextEntry={false}
				returnKeyType={index === 11 ? 'done' : 'next'}
				blurOnSubmit={false}
				editable={!loading}
			/>
		);
	};

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
				<Text style={styles.message}>{i18n.t('addPubky.enterRecoveryWords')}</Text>
				<View style={styles.keyContainer}>
					<View style={styles.mnemonicGrid}>
						<View style={styles.mnemonicColumn}>
							{Array.from({ length: 6 }, (_, index) => renderMnemonicInput(index))}
						</View>
						<View style={styles.mnemonicColumn}>
							{Array.from({ length: 6 }, (_, index) => renderMnemonicInput(index + 6))}
						</View>
					</View>
				</View>
				<View style={styles.buttonContainer}>
					<Button text={i18n.t('common.cancel')} size="large" onPress={handleCancel} />
					<Button
						text={i18n.t('import.title')}
						size="large"
						variant="secondary"
						loading={loading}
						disabled={!enableImport}
						onPress={handleImport}
					/>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	scrollViewWrapper: {
		height: '100%',
		zIndex: 1,
		position: 'relative',
		flex: 1,
		justifyContent: 'space-between',
	},
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'space-between',
	},
	message: {
		...textStyles.bodyM,
		marginBottom: 24,
	},
	keyContainer: {
		flex: 1,
		justifyContent: 'flex-start',
		paddingBottom: 20,
	},
	mnemonicGrid: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 6,
	},
	mnemonicColumn: {
		flex: 1,
	},
	mnemonicInput: {
		...textStyles.bodyM,
		borderWidth: 1,
		borderColor: '#444',
		borderStyle: 'dashed',
		borderRadius: 8,
		paddingVertical: 10,
		paddingHorizontal: 12,
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
	buttonContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
});

export default memo(MnemonicForm);
