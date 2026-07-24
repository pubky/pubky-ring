import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import KeyboardAccessory from './KeyboardAccessory.tsx';
import MnemonicSuggestionPill from './MnemonicSuggestionPill.tsx';

const MNEMONIC_WORD_COUNT = 12;
const MNEMONIC_SUGGESTION_ACCESSORY_ID_PREFIX = 'mnemonic-suggestion-accessory';
export const MNEMONIC_SUGGESTION_ACCESSORY_HEIGHT = 52;

export const getMnemonicSuggestionAccessoryId = (index: number): string =>
	`${MNEMONIC_SUGGESTION_ACCESSORY_ID_PREFIX}-${index}`;

interface MnemonicSuggestionAccessoryProps {
	suggestions: string[];
	bottomInset: number;
	onSuggestionPress: (word: string) => void;
}

const MnemonicSuggestionAccessory = ({
	suggestions,
	bottomInset,
	onSuggestionPress,
}: MnemonicSuggestionAccessoryProps): ReactElement => {
	const accessoryIds = useMemo(
		() => Array.from({ length: MNEMONIC_WORD_COUNT }, (_, index) => getMnemonicSuggestionAccessoryId(index)),
		[],
	);
	const renderSuggestions = (): ReactElement[] =>
		suggestions.map(word => <MnemonicSuggestionPill key={word} word={word} onPress={onSuggestionPress} />);

	return (
		<KeyboardAccessory
			accessoryIds={accessoryIds}
			visible={suggestions.length > 0}
			bottom={bottomInset}
			containerStyle={styles.container}
			androidContainerStyle={styles.androidContainer}
			emptyStyle={styles.emptyAccessory}
		>
			{renderSuggestions}
		</KeyboardAccessory>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 24,
		paddingVertical: 8,
	},
	androidContainer: {
		paddingHorizontal: 0,
	},
	emptyAccessory: {
		backgroundColor: '#000000',
	},
});

export default memo(MnemonicSuggestionAccessory);
