import React, { memo, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Keyboard,
	KeyboardEvent,
	Platform,
	StyleSheet,
	TextInput as NativeTextInput,
	TextInputKeyPressEvent,
	View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as bip39 from 'bip39';
import { SheetScreen } from '../components/Sheet.tsx';
import Button from '../components/Button.tsx';
import MnemonicSuggestionAccessory, {
	getMnemonicSuggestionAccessoryId,
} from '../components/MnemonicSuggestionAccessory.tsx';
import { BodyMText } from '../theme/typography';
import { TextInput } from '../theme/components.ts';
import { usePubkyManagement } from '../hooks/usePubkyManagement.ts';
import type { AddPubkyStackParamList } from '../sheets/types.ts';

const SHEET_ID = 'add-pubky';
const MNEMONIC_WORD_COUNT = 12;
const MNEMONIC_COLUMN_WORD_COUNT = MNEMONIC_WORD_COUNT / 2;
const MIN_SUGGESTION_PREFIX_LENGTH = 2;
const MAX_SUGGESTIONS = 3;
const SUGGESTION_KEYBOARD_GAP = 8;

const createEmptyMnemonicWords = (): string[] => Array(MNEMONIC_WORD_COUNT).fill('');
const createValidWordState = (): boolean[] => Array(MNEMONIC_WORD_COUNT).fill(true);

const cleanMnemonicWord = (word: string): string => {
	return word
		.replace(/^\d+\.\s*/, '')
		.toLowerCase()
		.trim();
};

const AddPubkyImportMnemonic = ({
	navigation,
}: NativeStackScreenProps<AddPubkyStackParamList, 'ImportMnemonic'>): ReactElement => {
	const { t } = useTranslation();
	const { importPubky } = usePubkyManagement();
	const [mnemonicWords, setMnemonicWords] = useState<string[]>(createEmptyMnemonicWords);
	const [validWords, setValidWords] = useState<boolean[]>(createValidWordState);
	const [focused, setFocused] = useState<number | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const inputRefs = useRef<(NativeTextInput | null)[]>(Array(MNEMONIC_WORD_COUNT).fill(null));
	const insets = useSafeAreaInsets();
	const [suggestionInset, setSuggestionInset] = useState<number>(0);

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

	useEffect(() => {
		const timer = setTimeout(() => {
			inputRefs.current[0]?.focus();
		}, 100);

		return (): void => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (Platform.OS === 'ios') {
			return;
		}

		const showSubscription = Keyboard.addListener('keyboardDidShow', (event: KeyboardEvent) => {
			const keyboardHeight = event.endCoordinates.height;
			setSuggestionInset(Math.max(0, keyboardHeight - insets.bottom + SUGGESTION_KEYBOARD_GAP));
		});
		const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
			setSuggestionInset(0);
		});

		return (): void => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, [insets.bottom]);

	const isValidWord = useCallback((word: string): boolean => {
		if (!word) {
			return true;
		}

		const cleanWord = cleanMnemonicWord(word);
		if (!cleanWord) {
			return true;
		}

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

			if (text.split(' ').length === MNEMONIC_WORD_COUNT) {
				const words = text.split(' ').map(cleanMnemonicWord);
				setMnemonicWords(words);
				setValidWords(words.map(word => isValidWord(word)));
				Keyboard.dismiss();
				return;
			}

			const numberPrefix = `${index + 1}. `;
			let word = text.startsWith(numberPrefix) ? text.substring(numberPrefix.length) : text;

			if (text === numberPrefix.trim() || text === `${index + 1}.`) {
				word = '';
			}

			const previousWord = mnemonicWords[index];
			const wasNotEmpty = previousWord && previousWord.length > 0;
			const isNowEmpty = word?.length === 0;

			setMnemonicWords(prev => {
				const newWords = [...prev];
				newWords[index] = word.toLowerCase();
				return newWords;
			});

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

			const expectedPrefix = `${index + 1}. `;
			if (word.startsWith(expectedPrefix)) {
				return word;
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
			setValidWords(prev => {
				const newValidWords = [...prev];
				const word = mnemonicWords[index];
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
				const mnemonicPhrase = mnemonicWords.map(cleanMnemonicWord).join(' ');
				const result = await importPubky(mnemonicPhrase);
				if (result.isOk()) {
					navigation.navigate('ImportSuccess', {
						pubky: result.value.pubky,
						isNewPubky: result.value.isNewPubky,
					});
				}
			}
		} finally {
			setLoading(false);
		}
	}, [enableImport, importPubky, mnemonicWords, navigation]);

	const handleSubmitEditing = useCallback(
		(index: number) => {
			if (index >= MNEMONIC_WORD_COUNT - 1) {
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
		navigation.goBack();
	}, [navigation]);

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
				inputAccessoryViewID={getMnemonicSuggestionAccessoryId(index)}
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
		<SheetScreen id={SHEET_ID} title={t('import.title')} scrollable={true}>
			<View style={styles.wrapper}>
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

				<MnemonicSuggestionAccessory
					suggestions={suggestions}
					bottomInset={suggestionInset}
					onSuggestionPress={handleSuggestionPress}
				/>
			</View>
		</SheetScreen>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
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

export default memo(AddPubkyImportMnemonic);
