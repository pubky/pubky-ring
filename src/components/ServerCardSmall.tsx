import React, { memo, ReactElement } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle, TouchableOpacity } from 'react-native';
import { TextBaseB } from '../theme/typography';
import { XLogo } from '../icons';
import { ActivityIndicator, ThemedView } from '../theme/components';

interface ServerCardSmallProps {
	name: string;
	style?: StyleProp<ViewStyle>;
	onRemove?: () => void;
	removeLabel?: string;
	disabled?: boolean;
	loading?: boolean;
}

const ServerCardSmall = ({
	name,
	style,
	onRemove,
	removeLabel,
	disabled,
	loading,
}: ServerCardSmallProps): ReactElement => (
	<ThemedView style={[styles.root, style]} colorName="card">
		<TextBaseB style={styles.name} numberOfLines={1}>
			{name}
		</TextBaseB>
		{onRemove && (
			<TouchableOpacity
				style={[styles.remove, disabled && styles.disabled]}
				onPress={onRemove}
				accessibilityRole="button"
				accessibilityLabel={removeLabel}
				disabled={disabled}
				testID="EditPubkyRemoveServerButton"
			>
				{loading ? (
					<ActivityIndicator size="small" testID="EditPubkySignOutProgress" />
				) : (
					<XLogo size={20} />
				)}
			</TouchableOpacity>
		)}
	</ThemedView>
);

const styles = StyleSheet.create({
	root: {
		borderRadius: 12,
		overflow: 'hidden',
		padding: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	name: { flex: 1 },
	remove: { padding: 4, margin: -4, marginLeft: 12 },
	disabled: { opacity: 0.4 },
});

export default memo(ServerCardSmall);
