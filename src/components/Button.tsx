import React, { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Theme } from '../theme';
import { BodySSBText, CaptionSBText } from '../theme/typography';
import { ActivityIndicator } from '../theme/components.ts';

enum EButtonSize {
	large = 'large',
	medium = 'medium',
	small = 'small',
}

type ButtonSize = `${EButtonSize}`;
type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
	text: string;
	size?: ButtonSize;
	variant?: ButtonVariant;
	icon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	loading?: boolean;
	disabled?: PressableProps['disabled'];
	style?: StyleProp<ViewStyle>;
	testID?: PressableProps['testID'];
	onPress?: PressableProps['onPress'];
	onPressIn?: PressableProps['onPressIn'];
	onLongPress?: PressableProps['onLongPress'];
};

const Button = ({
	text,
	size = EButtonSize.medium,
	variant = 'primary',
	icon,
	rightIcon,
	loading = false,
	disabled = false,
	style,
	testID,
	onPress,
	onPressIn,
	onLongPress,
}: ButtonProps): React.ReactElement => {
	const theme = useTheme() as Theme;

	const ButtonText = size === EButtonSize.small ? CaptionSBText : BodySSBText;

	const disabledStyle = disabled || loading ? styles.disabled : null;
	const pressedStyle = { backgroundColor: 'rgba(255, 255, 255, 0.16)' };
	const secondaryStyle =
		variant === 'secondary' ? { borderWidth: 1, borderColor: theme.colors.buttonBorder } : null;

	return (
		<Pressable
			style={({ pressed }) => [
				styles.container,
				buttonSizeStyles[size],
				{ backgroundColor: theme.colors.buttonBackground },
				secondaryStyle,
				pressed && pressedStyle,
				disabledStyle,
				style,
			]}
			disabled={loading || disabled}
			testID={testID}
			onPress={onPress}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
		>
			{loading ? (
				<ActivityIndicator size="small" />
			) : (
				<>
					{icon && icon}
					<ButtonText style={styles.text} numberOfLines={1} testID={`${testID}-Text`}>
						{text}
					</ButtonText>
					{rightIcon && rightIcon}
				</>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 6,
	},
	large: {
		flex: 1,
		minHeight: 64,
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
	},
	medium: {
		minHeight: 48,
		borderRadius: 48,
		paddingVertical: 12,
		paddingHorizontal: 12,
	},
	small: {
		minHeight: 32,
		borderRadius: 64,
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	disabled: {
		opacity: 0.32,
	},
	text: {
		flexShrink: 1,
	},
});

const buttonSizeStyles = {
	[EButtonSize.large]: styles.large,
	[EButtonSize.medium]: styles.medium,
	[EButtonSize.small]: styles.small,
};

export default memo(Button);
