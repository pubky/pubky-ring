import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Theme, ThemeColorName } from '../theme';
import { TextSmB, TextXsB } from '../theme/typography';
import { ActivityIndicator } from '../theme/components.ts';
import { shadows } from '../theme/shadows.ts';

enum EButtonSize {
	default = 'default',
	large = 'large',
	small = 'small',
}

type ButtonSize = `${EButtonSize}`;
type ButtonVariant = 'dark' | 'outline' | 'secondary';

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
	onPress?: () => void;
	onPressIn?: () => void;
	onLongPress?: () => void;
};

const Button = ({
	text,
	size = EButtonSize.default,
	variant = 'outline',
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

	const ButtonText = size === EButtonSize.small ? TextXsB : TextSmB;
	const foregroundColorName: ThemeColorName = variant === 'secondary' ? 'secondaryForeground' : 'foreground';
	const loadingStyle = loading ? styles.loading : null;
	const disabledStyle = disabled ? styles.disabled : null;
	const backgroundColors: Record<ButtonVariant, string> = {
		dark: theme.colors.card,
		outline: 'rgba(255, 255, 255, 0.045)',
		secondary: theme.colors.secondary,
	};
	const pressedColors: Record<ButtonVariant, string> = {
		dark: theme.colors.muted,
		outline: 'rgba(255, 255, 255, 0.075)',
		secondary: '#454549',
	};
	const borderColors: Partial<Record<ButtonVariant, string>> = {
		dark: theme.colors.card,
		outline: theme.colors.border,
	};

	const pressedStyle = { backgroundColor: pressedColors[variant] };
	const backgroundStyle = { backgroundColor: backgroundColors[variant] };
	const borderStyle = borderColors[variant] ? { borderWidth: 1, borderColor: borderColors[variant] } : null;

	const renderIcon = (iconNode: React.ReactNode): React.ReactNode => {
		if (!React.isValidElement<{ colorName?: ThemeColorName }>(iconNode) || iconNode.type === React.Fragment) {
			return iconNode;
		}

		return React.cloneElement(iconNode, { colorName: foregroundColorName });
	};

	return (
		<Pressable
			style={[styles.container, buttonSizeStyles[size], disabledStyle, loadingStyle, style]}
			disabled={loading || disabled}
			testID={testID}
			onPress={onPress}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
		>
			{({ pressed }) => (
				<>
					<View
						style={[styles.backgroundLayer, buttonRadiusStyles[size], backgroundStyle, borderStyle]}
						pointerEvents="none"
					>
						{pressed && <View style={[styles.pressOverlay, pressedStyle]} />}
					</View>

					{loading ? (
						<>
							<ActivityIndicator size="small" />
							<ButtonText
								style={styles.text}
								colorName={foregroundColorName}
								numberOfLines={1}
								testID={`${testID}-Text`}
							>
								{text}
							</ButtonText>
						</>
					) : (
						<>
							{icon && renderIcon(icon)}
							<ButtonText
								style={styles.text}
								colorName={foregroundColorName}
								numberOfLines={1}
								testID={`${testID}-Text`}
							>
								{text}
							</ButtonText>
							{rightIcon && renderIcon(rightIcon)}
						</>
					)}
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
		...shadows.xs,
	},
	backgroundLayer: {
		...StyleSheet.absoluteFill,
		overflow: 'hidden',
	},
	blurBackground: {
		...StyleSheet.absoluteFill,
	},
	pressOverlay: {
		...StyleSheet.absoluteFill,
	},
	large: {
		flex: 1,
		height: 60,
		borderRadius: 60,
		paddingHorizontal: 20,
	},
	default: {
		height: 40,
		borderRadius: 40,
		paddingHorizontal: 12,
	},
	small: {
		height: 32,
		borderRadius: 32,
		paddingHorizontal: 12,
	},
	loading: {
		opacity: 0.5,
	},
	disabled: {
		opacity: 0.4,
	},
	text: {
		flexShrink: 1,
	},
});

const buttonSizeStyles = {
	[EButtonSize.default]: styles.default,
	[EButtonSize.large]: styles.large,
	[EButtonSize.small]: styles.small,
};

const buttonRadiusStyles = {
	[EButtonSize.default]: { borderRadius: styles.default.borderRadius },
	[EButtonSize.large]: { borderRadius: styles.large.borderRadius },
	[EButtonSize.small]: { borderRadius: styles.small.borderRadius },
};

export default memo(Button);
