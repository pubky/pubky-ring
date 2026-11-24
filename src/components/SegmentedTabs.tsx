import React, { memo, ReactElement } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import type { Theme } from '../theme';
import { TextXsSb } from '../theme/typography';

type SegmentedTabsProps<T extends string | number> = {
	options: ReadonlyArray<{ value: T; label: string }>;
	value: T;
	onChange: (value: T) => void;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	accessibilityLabel?: string;
};

/** A row of equal-width tabs with an underline, for picking one of a few options. */
const SegmentedTabs = <T extends string | number>({
	options,
	value,
	onChange,
	disabled = false,
	style,
	testID,
	accessibilityLabel,
}: SegmentedTabsProps<T>): ReactElement => {
	const theme = useTheme() as Theme;
	return (
		<View style={[styles.row, style]} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
			{options.map(option => {
				const selected = option.value === value;
				return (
					<Pressable
						key={String(option.value)}
						style={[
							styles.tab,
							selected ? { borderBottomColor: theme.colors.foreground } : styles.unselectedTab,
						]}
						disabled={disabled}
						accessibilityRole="tab"
						accessibilityState={{ selected, disabled }}
						testID={testID ? `${testID}-${option.value}` : undefined}
						onPress={(): void => onChange(option.value)}
					>
						<TextXsSb style={[styles.label, !selected && styles.unselected]}>{option.label}</TextXsSb>
					</Pressable>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		gap: 12,
	},
	tab: {
		flex: 1,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
		borderBottomWidth: 1,
	},
	label: {
		letterSpacing: 0.2,
	},
	unselected: {
		opacity: 0.5,
	},
	unselectedTab: {
		borderBottomColor: 'rgba(255, 255, 255, 0.16)',
	},
});

export default memo(SegmentedTabs) as typeof SegmentedTabs;
