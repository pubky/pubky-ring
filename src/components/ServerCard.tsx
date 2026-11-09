import React, { memo, ReactElement, ReactNode, useMemo } from 'react';
import { StyleSheet, StyleProp, ViewStyle, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { TextBaseB, TextBaseM } from '../theme/typography';
import { ThemedView } from '../theme/components';
import type { Theme } from '../theme';

interface ServerCardProps {
	name: string;
	publicKey: string;
	selected?: boolean;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	testID?: string;
	headerRight?: ReactNode;
}
const ServerCard = ({
	name,
	publicKey,
	selected = false,
	style,
	onPress,
	testID,
	headerRight,
}: ServerCardProps): ReactElement => {
	const theme = useTheme() as Theme;
	const borderStyle = useMemo(
		() => ({ borderColor: selected ? theme.colors.foreground : 'transparent' }),
		[selected, theme.colors.foreground],
	);
	const content = (
		<>
			<View style={styles.header}>
				<TextBaseB style={styles.name} numberOfLines={1}>
					{name}
				</TextBaseB>
				{headerRight}
			</View>
			<TextBaseM selectable={!onPress}>{publicKey}</TextBaseM>
		</>
	);
	return (
		<ThemedView style={[styles.root, borderStyle, style]} colorName="card">
			{onPress ? (
				<TouchableOpacity
					style={styles.content}
					onPress={onPress}
					testID={testID}
					accessibilityRole="radio"
					accessibilityLabel={`${name}, ${publicKey}`}
					accessibilityState={{ checked: selected }}
				>
					{content}
				</TouchableOpacity>
			) : (
				<View style={styles.content} testID={testID}>
					{content}
				</View>
			)}
		</ThemedView>
	);
};
const styles = StyleSheet.create({
	root: { overflow: 'hidden', borderRadius: 12, borderWidth: 1 },
	content: { paddingVertical: 16, paddingHorizontal: 20 },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
	name: { flex: 1 },
});
export default memo(ServerCard);
