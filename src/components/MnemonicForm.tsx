import React, { memo, ReactElement, useCallback, useState, useRef, useMemo, useEffect } from 'react';
import {
	StyleSheet,
	TextInput as NativeTextInput,
	TextInputKeyPressEvent,
	Keyboard,
	Platform,
	View,
	ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as bip39 from 'bip39';
import { TextInput } from '../theme/components.ts';
import Button from '../components/Button.tsx';
import { Result } from '@synonymdev/result';
import { BodyMText } from '../theme/typography';
import MnemonicSuggestionAccessory, {
	getMnemonicSuggestionAccessoryId,
} from './MnemonicSuggestionAccessory.tsx';
import SafeAreaInset from './SafeAreaInset.tsx';

interface MnemonicFormProps {
	onCancel: () => void;
	onImport: (mnemonicPhrase: string) => Promise<Result<string>>;
}

const MNEMONIC_WORD_COUNT = 12;
const MNEMONIC_COLUMN_WORD_COUNT = MNEMONIC_WORD_COUNT / 2;
const MIN_SUGGESTION_PREFIX_LENGTH = 2;
const MAX_SUGGESTIONS = 3;

const createEmptyMnemonicWords = (): string[] => Array(MNEMONIC_WORD_COUNT).fill('');
const createValidWordState = (): boolean[] => Array(MNEMONIC_WORD_COUNT).fill(true);

const cleanMnemonicWord = (word: string): string => {
	return word
		.replace(/^\d+\.\s*/, '')
		.toLowerCase()
		.trim();
};

const MnemonicForm = ({ onCancel, onImport }: MnemonicFormProps): ReactElement => {
	const { t } = useTranslation();
	const [mnemonicWords, setMnemonicWords] = useState<string[]>(createEmptyMnemonicWords);
	const [validWords, setValidWords] = useState<boolean[]>(createValidWordState);
	const [focused, setFocused] = useState<number | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const inputRefs = useRef<(NativeTextInput | null)[]>(Array(MNEMONIC_WORD_COUNT).fill(null));
	const accessoryInstanceId = useRef(Math.random().toString(36).slice(2)).current;
	const keyboardVisible = focused !== null;

	const suggestions = useMemo(() => {
		if (focused === null) {
			return [];
		}

		const currentWord = cleanMnemonicWord(mnemonicWords[focused]);

		if (currentWord.length < MIN_SUGGESTION_PREFIX_LENGTH || bip39.wordlists.english.includes(currentWord)) {
			return [];
		}

		return bip39.wordlists.english.filter(word => word.startsWith(currentWord)).slice(0, MAX_SUGGESTIONS);
	}, [focused, mnemonicWords]);

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

		const cleanWord = cleanMnemonicWord(word);
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
			setFocused(index);
			text = text.trim();

			// Detect if user pastes whole seed in any input
			if (text.split(' ').length === MNEMONIC_WORD_COUNT) {
				const words = text.split(' ').map(cleanMnemonicWord);
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
			setFocused(currentFocused => (currentFocused === index ? null : currentFocused));
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
				const cleanedWords = mnemonicWords.map(cleanMnemonicWord);

				// Join the cleaned words into a single string separated by spaces
				const mnemonicPhrase = cleanedWords.join(' ');

				// Pass the mnemonic phrase string
				await onImport(mnemonicPhrase);
			}
		} finally {
			setLoading(false);
		}
	}, [mnemonicWords, onImport, enableImport]);

	const handleSubmitEditing = useCallback(
		(index: number) => {
			if (index >= MNEMONIC_WORD_COUNT - 1) {
				// Last input or invalid focus
				if (enableImport) {
					handleImport();
				}
				return;
			}
			inputRefs.current[index + 1]?.focus();
		},
		[enableImport, handleImport],
	);

	const handleKeyPress = useCallback(
		({ nativeEvent }: TextInputKeyPressEvent) => {
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

	const handleSuggestionPress = useCallback(
		(word: string) => {
			if (focused === null) {
				return;
			}

			setMnemonicWords(prev => {
				const newWords = [...prev];
				newWords[focused] = word;
				return newWords;
			});
			setValidWords(prev => {
				const newValidWords = [...prev];
				newValidWords[focused] = true;
				return newValidWords;
			});

			if (focused < MNEMONIC_WORD_COUNT - 1) {
				inputRefs.current[focused + 1]?.focus();
			} else {
				Keyboard.dismiss();
			}
		},
		[focused],
	);

	const handleCancel = useCallback(() => {
		setMnemonicWords(createEmptyMnemonicWords());
		setValidWords(createValidWordState());
		setFocused(null);
		onCancel();
	}, [onCancel]);

	const renderMnemonicInput = (index: number): ReactElement => {
		const isInvalid = mnemonicWords[index] && !validWords[index];

		return (
			<TextInput
				key={index}
				ref={ref => {
					inputRefs.current[index] = ref;
				}}
				style={[styles.mnemonicInput, isInvalid && styles.invalidInput, loading && styles.disabledInput]}
				value={getDisplayValue(index)}
				placeholder={`${index + 1}.`}
				placeholderTextColor="rgba(255, 255, 255, 0.32)"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="off"
				textContentType="none"
				inputAccessoryViewID={getMnemonicSuggestionAccessoryId(index, accessoryInstanceId)}
				importantForAutofill="no"
				spellCheck={false}
				secureTextEntry={false}
				returnKeyType={index === 11 ? 'done' : 'next'}
				submitBehavior="submit"
				editable={!loading}
				testID={`MnemonicWordInput-${index + 1}`}
				onChangeText={text => updateMnemonicWord(index, text)}
				onFocus={() => handleFocus(index)}
				onBlur={() => handleBlur(index)}
				onSubmitEditing={() => handleSubmitEditing(index)}
				onKeyPress={handleKeyPress}
			/>
		);
	};

	return (
		<View style={styles.wrapper}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="interactive"
				showsVerticalScrollIndicator={false}
				bounces={false}
			>
				<BodyMText style={styles.message}>{t('addPubky.enterRecoveryWords')}</BodyMText>
				<View style={styles.keyContainer}>
					<View style={styles.mnemonicGrid}>
						<View style={styles.mnemonicColumn}>
							{Array.from({ length: MNEMONIC_COLUMN_WORD_COUNT }, (_, index) => renderMnemonicInput(index))}
						</View>
						<View style={styles.mnemonicColumn}>
							{Array.from({ length: MNEMONIC_COLUMN_WORD_COUNT }, (_, index) =>
								renderMnemonicInput(index + MNEMONIC_COLUMN_WORD_COUNT),
							)}
						</View>
					</View>
				</View>

				{!keyboardVisible && (
					<>
						<View style={styles.buttonContainer}>
							<Button
								text={t('common.cancel')}
								size="large"
								testID="MnemonicCancelButton"
								onPress={handleCancel}
							/>
							<Button
								text={t('import.title')}
								size="large"
								variant="secondary"
								loading={loading}
								disabled={!enableImport}
								testID="MnemonicImportButton"
								onPress={handleImport}
							/>
						</View>

						<SafeAreaInset edge="bottom" />
					</>
				)}
			</ScrollView>

			<MnemonicSuggestionAccessory
				suggestions={suggestions}
				instanceId={accessoryInstanceId}
				onSuggestionPress={handleSuggestionPress}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
	},
	message: {
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
		gap: 6,
	},
	mnemonicInput: {
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.32)',
		borderStyle: 'dashed',
		borderRadius: 8,
		paddingLeft: 12,
		paddingRight: 12,
		height: 46,
	},
	invalidInput: {
		borderColor: '#ff0000',
		color: '#ff0000',
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
