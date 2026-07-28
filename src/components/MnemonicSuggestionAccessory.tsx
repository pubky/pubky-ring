import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import KeyboardAccessory from './KeyboardAccessory.tsx';
import MnemonicSuggestionPill from './MnemonicSuggestionPill.tsx';

const MNEMONIC_WORD_COUNT = 12;
const MNEMONIC_SUGGESTION_ACCESSORY_ID_PREFIX = 'mnemonic-suggestion-accessory';

export const getMnemonicSuggestionAccessoryId = (index: number, instanceId: string): string =>
	`${MNEMONIC_SUGGESTION_ACCESSORY_ID_PREFIX}-${instanceId}-${index}`;

interface MnemonicSuggestionAccessoryProps {
	suggestions: string[];
	instanceId: string;
	onSuggestionPress: (word: string) => void;
}

const MnemonicSuggestionAccessory = ({
	suggestions,
	instanceId,
	onSuggestionPress,
}: MnemonicSuggestionAccessoryProps): ReactElement => {
	const accessoryIds = useMemo(
		() =>
			Array.from({ length: MNEMONIC_WORD_COUNT }, (_, index) =>
				getMnemonicSuggestionAccessoryId(index, instanceId),
			),
		[instanceId],
	);
	const renderSuggestions = (): ReactElement[] =>
		suggestions.map(word => <MnemonicSuggestionPill key={word} word={word} onPress={onSuggestionPress} />);

	return (
		<KeyboardAccessory
			accessoryIds={accessoryIds}
			visible={suggestions.length > 0}
			containerStyle={styles.container}
			androidContainerStyle={styles.androidContainer}
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
});

export default memo(MnemonicSuggestionAccessory);
