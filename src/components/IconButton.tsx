import React, { ReactElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

type IconButtonProps = {
	icon: React.ReactNode;
	size?: number;
	active?: boolean;
	disabled?: PressableProps['disabled'];
	style?: StyleProp<ViewStyle>;
	testID?: PressableProps['testID'];
	onPress?: PressableProps['onPress'];
};

const IconButton = ({
	active = false,
	disabled = false,
	icon,
	style,
	testID,
	onPress,
}: IconButtonProps): ReactElement => (
	<Pressable
		disabled={disabled}
		style={({ pressed }) => [
			styles.root,
			active && styles.active,
			disabled && styles.disabled,
			pressed && styles.pressed,
			style,
		]}
		testID={testID}
		onPress={onPress}
	>
		{icon}
	</Pressable>
);

const styles = StyleSheet.create({
	root: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 48,
		height: 48,
		borderRadius: '50%',
		backgroundColor: 'rgba(255, 255, 255, 0.16)',
	},
	active: {
		backgroundColor: 'rgba(255, 255, 255, 0.32)',
	},
	pressed: {
		backgroundColor: 'rgba(255, 255, 255, 0.32)',
	},
	disabled: {
		opacity: 0.32,
	},
});

export default IconButton;
