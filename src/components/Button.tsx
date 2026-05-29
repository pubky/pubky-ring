import React, { memo, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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

const CONTENT_GAP = 6;

const toSingleLineLabel = (label: string): string => label.replace(/ /g, '\u00A0');

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
	const ButtonText = size === EButtonSize.small ? CaptionSBText : BodySSBText;
	const displayText = useMemo(() => toSingleLineLabel(text), [text]);

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
			) : size === EButtonSize.large ? (
				<View style={[styles.content, styles.contentLarge]}>
					<View style={styles.contentLargeInner}>
						{icon && <View style={styles.iconSlot}>{icon}</View>}
						<ButtonText
							style={[styles.text, styles.textLarge, textStyle]}
							testID={`${testID}-Text`}
						>
							{displayText}
						</ButtonText>
						{rightIcon && <View style={styles.iconSlot}>{rightIcon}</View>}
					</View>
				</View>
			) : (
				<View style={styles.content}>
					{icon && icon}
					<ButtonText
						style={[styles.text, textStyle]}
						numberOfLines={1}
						adjustsFontSizeToFit
						minimumFontScale={0.8}
						testID={`${testID}-Text`}
					>
						{displayText}
					</ButtonText>
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
		gap: CONTENT_GAP,
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: CONTENT_GAP,
	},
	contentLarge: {
		flex: 1,
		minWidth: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	contentLargeInner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: CONTENT_GAP,
	},
	iconSlot: {
		flexShrink: 0,
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
		alignSelf: 'center',
		flexShrink: 1,
		textAlign: 'center',
		letterSpacing: 0,
		...(Platform.OS === 'android' ? { paddingRight: 2 } : null),
	},
	textLarge: {
		flexShrink: 0,
		textAlign: 'center',
	},
});

const buttonSizeStyles = {
	[EButtonSize.large]: styles.large,
	[EButtonSize.medium]: styles.medium,
	[EButtonSize.small]: styles.small,
};

export default memo(Button);
