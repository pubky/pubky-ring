import React, { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import type { Theme } from '../theme';

type IconButtonProps = {
	icon: React.ReactNode;
	size?: number;
	active?: boolean;
	disabled?: PressableProps['disabled'];
	style?: StyleProp<ViewStyle>;
	testID?: PressableProps['testID'];
	onPress?: () => void;
};

const IconButton = ({
	active = false,
	disabled = false,
	icon,
	style,
	testID,
	onPress,
}: IconButtonProps): ReactElement => {
	const theme = useTheme() as Theme;
	const backgroundStyle = { backgroundColor: theme.colors.secondary };

	return (
		<Pressable
			style={[styles.root, disabled && styles.disabled, style]}
			disabled={disabled}
			testID={testID}
			onPress={onPress}
		>
			{({ pressed }) => (
				<>
					<View style={[styles.background, backgroundStyle]} pointerEvents="none">
						{(active || pressed) && <View style={styles.pressOverlay} />}
					</View>
					{icon}
				</>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	root: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 48,
		height: 48,
		borderRadius: '50%',
	},
	background: {
		...StyleSheet.absoluteFill,
		borderRadius: '50%',
		overflow: 'hidden',
	},
	pressOverlay: {
		...StyleSheet.absoluteFill,
		backgroundColor: 'rgba(255, 255, 255, 0.16)',
	},
	disabled: {
		opacity: 0.4,
	},
});

export default IconButton;
