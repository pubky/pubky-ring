import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { CaptionSBSpacedText } from '../theme/typography';

interface MnemonicSuggestionPillProps {
	word: string;
	onPress: (word: string) => void;
}

const MnemonicSuggestionPill = ({ word, onPress }: MnemonicSuggestionPillProps): ReactElement => {
	return (
		<TouchableOpacity style={styles.pill} activeOpacity={0.8} onPress={() => onPress(word)}>
			<CaptionSBSpacedText style={styles.text} colorName="textPrimary">
				{word}
			</CaptionSBSpacedText>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	pill: {
		height: 32,
		borderRadius: 64,
		backgroundColor: 'rgba(255, 255, 255, 0.10)',
		paddingHorizontal: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		includeFontPadding: false,
	},
});

export default memo(MnemonicSuggestionPill);
