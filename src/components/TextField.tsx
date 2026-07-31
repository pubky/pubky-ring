import React, { forwardRef, ReactNode, useState } from 'react';
import { Platform, StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import type { LayoutChangeEvent, TextInput as NativeTextInput, TextInputProps } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import styled, { useTheme } from 'styled-components/native';
import { fontFamily } from '../theme/fonts';
import { TextSmM } from '../theme/typography';
import type { Theme } from '../theme';
import { shadows } from '../theme/shadows.ts';

type TextFieldProps = TextInputProps & {
	containerStyle?: StyleProp<ViewStyle>;
	error?: string;
	errorStyle?: StyleProp<TextStyle>;
	hasError?: boolean;
	helperText?: string;
	helperTextStyle?: StyleProp<TextStyle>;
	leftElement?: ReactNode;
	rightElement?: ReactNode;
	success?: boolean;
};

const BORDER_RADIUS = 8;
const BORDER_WIDTH = 1;
const DASH_PATTERN = '2 2';

const StyledTextInput = styled.TextInput.attrs<{ theme: Theme }>(props => ({
	keyboardAppearance: props.theme.keyboardAppearance,
}))`
	color: ${(props): string => props.theme.colors.foreground};
	font-family: ${fontFamily};
	font-size: 16px;
	font-weight: 500;
	padding-left: 24px;
	padding-right: 24px;
	include-font-padding: false;
`;

const TextField = forwardRef<NativeTextInput, TextFieldProps>(
	(
		{
			containerStyle,
			error,
			errorStyle,
			hasError = false,
			helperText,
			helperTextStyle,
			leftElement,
			rightElement,
			style,
			success = false,
			...props
		},
		ref,
	) => {
		const theme = useTheme() as Theme;
		const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
		const stateColor = error || hasError ? theme.colors.danger : success ? theme.colors.pubkyApp : undefined;
		const borderColor = stateColor ?? theme.colors.input;

		const handleContainerLayout = ({ nativeEvent }: LayoutChangeEvent): void => {
			const { width, height } = nativeEvent.layout;
			setContainerSize(currentSize => {
				if (currentSize.width === width && currentSize.height === height) {
					return currentSize;
				}

				return { width, height };
			});
		};

		return (
			<View>
				<View style={[styles.container, containerStyle]} onLayout={handleContainerLayout}>
					{containerSize.width > 0 && containerSize.height > 0 && (
						<Svg
							style={styles.border}
							width={containerSize.width}
							height={containerSize.height}
							pointerEvents="none"
						>
							<Rect
								x={BORDER_WIDTH / 2}
								y={BORDER_WIDTH / 2}
								width={containerSize.width - BORDER_WIDTH}
								height={containerSize.height - BORDER_WIDTH}
								rx={BORDER_RADIUS}
								ry={BORDER_RADIUS}
								fill="none"
								stroke={borderColor}
								strokeWidth={BORDER_WIDTH}
								strokeDasharray={DASH_PATTERN}
							/>
						</Svg>
					)}
					{leftElement}
					<StyledTextInput
						ref={ref}
						style={[styles.input, stateColor ? { color: stateColor } : null, style]}
						placeholderTextColor={theme.colors.input}
						{...props}
					/>
					{rightElement}
				</View>

				{error ? (
					<TextSmM colorName="danger" style={errorStyle}>
						{error}
					</TextSmM>
				) : helperText ? (
					<TextSmM style={helperTextStyle}>{helperText}</TextSmM>
				) : null}
			</View>
		);
	},
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(5, 5, 10, 0.1)',
		borderRadius: BORDER_RADIUS,
		height: 56,
		...Platform.select({
			ios: shadows.xs,
		}),
	},
	border: {
		...StyleSheet.absoluteFill,
	},
	input: {
		flex: 1,
	},
});

export default TextField;
