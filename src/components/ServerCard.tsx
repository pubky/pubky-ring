import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, StyleProp, ViewStyle, View, TouchableOpacity } from 'react-native';
import { useTheme } from 'styled-components/native';
import { TextBaseB, TextBaseM } from '../theme/typography';
import { Pencil, Trash2 } from '../icons/index.ts';
import { ThemedView } from '../theme/components.ts';
import type { Theme } from '../theme';

interface ServerCardProps {
	name: string;
	publicKey: string;
	selected?: boolean;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
}

const ServerCard = ({
	name,
	publicKey,
	selected = false,
	style,
	onPress,
	onEdit,
	onDelete,
}: ServerCardProps): ReactElement => {
	const theme = useTheme() as Theme;
	const borderStyle = useMemo<ViewStyle>(
		() => ({ borderColor: selected ? theme.colors.foreground : 'transparent' }),
		[selected, theme.colors.foreground],
	);

	return (
		<ThemedView style={[styles.root, borderStyle, style]} colorName="card">
			<TouchableOpacity style={styles.content} activeOpacity={0.7} onPress={onPress}>
				<View style={styles.row}>
					<TextBaseB numberOfLines={1}>{name}</TextBaseB>

					<View style={styles.actions}>
						<TouchableOpacity style={styles.action} activeOpacity={0.7} disabled={!onEdit} onPress={onEdit}>
							<Pencil size={20} />
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.action, !onDelete && styles.disabledAction]}
							activeOpacity={0.7}
							disabled={!onDelete}
							onPress={onDelete}
						>
							<Trash2 size={20} />
						</TouchableOpacity>
					</View>
				</View>

				<TextBaseM>{publicKey}</TextBaseM>
			</TouchableOpacity>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		overflow: 'hidden',
		borderRadius: 12,
		borderWidth: 1,
	},
	content: {
		paddingVertical: 16,
		paddingHorizontal: 20,
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	action: {
		height: 36,
		width: 36,
		justifyContent: 'center',
		alignItems: 'center',
	},
	disabledAction: {
		opacity: 0.32,
	},
});

export default memo(ServerCard);
