import React, { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
	Text,
	ActionButton,
	ActivityIndicator,
} from '../theme/components.ts';

const Button = ({
	text,
	loading = false,
	onPress = (): null => null,
	onPressIn = (): null => null,
	onLongPress = (): null => null,
	icon = undefined,
	style = {},
	textStyle = {},
	activeOpacity = 0.7,
	disabled = false,
}: {
    text: string;
    loading?: boolean;
    onPress?: () => void;
	onPressIn?: () => void;
	onLongPress?: () => void;
    icon?: React.ReactElement;
    style?: object;
    textStyle?: object;
	activeOpacity?: number;
	disabled?: boolean;
}): React.ReactElement => {
	const disabledStyle = useMemo(() => (disabled || loading ? styles.disabled : null), [disabled, loading]);
	return (
		<ActionButton
			style={[styles.actionButton, disabledStyle, style]}
			onPress={onPress}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
			disabled={loading || disabled}
			activeOpacity={activeOpacity}
		>
			{loading ? (<ActivityIndicator size="small" />) : (
				<>
					{icon && icon}
					<Text style={[styles.actionButtonText, textStyle]}>{text}</Text>
				</>
			)}
		</ActionButton>
	);
};

const styles = StyleSheet.create({
	actionButton: {
		flexDirection: 'row',
		width: 110,
		minHeight: 48,
		borderRadius: 48,
		paddingVertical: 15,
		paddingHorizontal: 15,
		alignContent: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	disabled: {
		opacity: 0.5,
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		alignSelf: 'center',
	},
});

export default memo(Button);
