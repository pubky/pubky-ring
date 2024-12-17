import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import {
	Text,
	ActionButton,
	ActivityIndicator,
} from '../theme/components.ts';

const Button = ({
	text,
	loading = false,
	onPress = () => null,
	onPressIn = () => null,
	onLongPress = () => null,
	icon = undefined,
	style = {},
	textStyle = {},
	activeOpacity = 0.7,
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
}): React.ReactElement => {
	return (
		<ActionButton
			style={[styles.actionButton, style]}
			onPress={onPress}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
			disabled={loading}
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
		paddingHorizontal: 24,
		alignContent: 'center',
		justifyContent: 'center',
	},
	actionButtonText: {
		fontSize: 15,
		fontWeight: 600,
		lineHeight: 18,
		letterSpacing: 0.2,
		marginLeft: 5,
	},
});

export default memo(Button);
