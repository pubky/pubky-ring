import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Theme } from '../theme';
import { textStyles } from '../theme/utils';
import { Text, ActivityIndicator } from '../theme/components.ts';

enum EButtonSize {
	large = 'large',
	medium = 'medium',
	small = 'small',
}

type ButtonSize = `${EButtonSize}`;
type ButtonVariant = 'primary' | 'secondary';

const Button = ({
	testID,
	text,
	loading = false,
	size = EButtonSize.medium,
	variant = 'primary',
	icon = undefined,
	rightIcon = undefined,
	style = {},
	textStyle = {},
	disabled = false,
	onPress = (): null => null,
	onPressIn = (): null => null,
	onLongPress = (): null => null,
}: {
	testID?: string;
	text: string;
	loading?: boolean;
	size?: ButtonSize;
	variant?: ButtonVariant;
	icon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	style?: object;
	textStyle?: object;
	activeOpacity?: number;
	disabled?: boolean;
	onPress?: () => void;
	onPressIn?: () => void;
	onLongPress?: () => void;
}): React.ReactElement => {
	const theme = useTheme() as Theme;
	const disabledStyle = useMemo(() => (disabled || loading ? styles.disabled : null), [disabled, loading]);
	const variantStyle = useMemo(() => {
		if (variant !== 'secondary') {
			return {
				backgroundColor: theme.colors.buttonBackground,
			};
		}

		return {
			backgroundColor: theme.colors.buttonBackground,
			borderColor: theme.colors.buttonBorder,
			borderWidth: 1,
		};
	}, [theme.colors.buttonBackground, theme.colors.buttonBorder, variant]);

	const pressedStyle = useMemo(
		() => ({
			backgroundColor: 'rgba(255, 255, 255, 0.16)',
			borderColor: theme.colors.buttonBorder,
		}),
		[theme.colors.buttonBorder],
	);

	return (
		<Pressable
			style={({ pressed }) => [
				styles.container,
				buttonSizeStyles[size],
				variantStyle,
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
				<View style={styles.content}>
					{icon && icon}
					<Text
						testID={`${testID}-Text`}
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.8}
						style={[styles.text, buttonTextSizeStyles[size], textStyle]}
					>
						{text}
					</Text>
					{rightIcon && rightIcon}
				</View>
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
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
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
		...textStyles.bodySSB,
		alignSelf: 'center',
	},
});

const buttonSizeStyles = {
	[EButtonSize.large]: styles.large,
	[EButtonSize.medium]: styles.medium,
	[EButtonSize.small]: styles.small,
};

const buttonTextSizeStyles = {
	[EButtonSize.large]: textStyles.bodySSB,
	[EButtonSize.medium]: textStyles.bodySSB,
	[EButtonSize.small]: textStyles.captionSB,
};

export default memo(Button);
