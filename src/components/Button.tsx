import React, { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Theme } from '../theme';
import { BodySSBText, CaptionSBText } from '../theme/typography';
import { ActivityIndicator } from '../theme/components.ts';
import BlurView from './BlurView.tsx';

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
	onPress?: () => void;
	onPressIn?: () => void;
	onLongPress?: () => void;
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

	const hasBlur = Platform.OS === 'ios';
	const ButtonText = size === EButtonSize.small ? CaptionSBText : BodySSBText;
	const disabledStyle = disabled || loading ? styles.disabled : null;
	const pressedStyle = { backgroundColor: 'rgba(255, 255, 255, 0.16)' };
	const backgroundStyle = { backgroundColor: theme.colors.buttonBackground };
	const secondaryStyle =
		variant === 'secondary' ? { borderWidth: 1, borderColor: theme.colors.buttonBorder } : null;

	return (
		<Pressable
			style={[styles.container, buttonSizeStyles[size], disabledStyle, style]}
			disabled={loading || disabled}
			testID={testID}
			onPress={onPress}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
		>
			{({ pressed }) => (
				<>
					<View
						style={[styles.backgroundLayer, buttonRadiusStyles[size], backgroundStyle, secondaryStyle]}
						pointerEvents="none"
					>
						{hasBlur && <BlurView style={styles.blurBackground} pressed={pressed} />}
						{pressed && <View style={[styles.pressOverlay, pressedStyle]} />}
					</View>

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
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 16,
		},
		shadowOpacity: 0.16,
		shadowRadius: 16,
		elevation: 8,
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
		height: 64,
		borderRadius: 64,
		paddingHorizontal: 20,
	},
	medium: {
		height: 48,
		borderRadius: 48,
		paddingHorizontal: 12,
	},
	small: {
		height: 32,
		borderRadius: 64,
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

const buttonRadiusStyles = {
	[EButtonSize.large]: { borderRadius: styles.large.borderRadius },
	[EButtonSize.medium]: { borderRadius: styles.medium.borderRadius },
	[EButtonSize.small]: { borderRadius: styles.small.borderRadius },
};

export default memo(Button);
