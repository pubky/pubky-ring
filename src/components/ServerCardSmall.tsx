import React, { memo, ReactElement } from 'react';
import { StyleSheet, StyleProp, ViewStyle, View, TouchableOpacity } from 'react-native';
import { TextBaseB } from '../theme/typography.ts';
import { XLogo } from '../icons/index.ts';
import { ThemedView } from '../theme/components.ts';

interface ServerCardSmallProps {
	name: string;
	style?: StyleProp<ViewStyle>;
	onDelete?: () => void;
}

const ServerCardSmall = ({ name, style, onDelete }: ServerCardSmallProps): ReactElement => {
	return (
		<ThemedView style={[styles.root, style]} colorName="card">
			<View style={styles.content}>
				<TextBaseB numberOfLines={1}>{name}</TextBaseB>

				<View style={styles.actions}>
					<TouchableOpacity activeOpacity={0.7} onPress={onDelete}>
						<XLogo size={20} />
					</TouchableOpacity>
				</View>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		borderRadius: 12,
		overflow: 'hidden',
	},
	content: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 24,
	},
	actions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
});

export default memo(ServerCardSmall);
