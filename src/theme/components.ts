import { ComponentType, RefAttributes } from 'react';
import { TextInput as NativeTextInput, TextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Theme, ThemeColorName } from './index';
import { fontFamily } from './fonts';

interface BackgroundColorProps {
	colorName?: ThemeColorName;
}

const backgroundColor =
	(defaultColorName: ThemeColorName) =>
	({ colorName, theme }: BackgroundColorProps & { theme: Theme }): string => {
		return theme.colors[colorName ?? defaultColorName];
	};

export const View = styled.View<BackgroundColorProps>`
	background-color: ${backgroundColor('background')};
	border-color: ${(props): string => props.theme.colors.textPrimary};
`;

const StyledTextInput = styled.TextInput.attrs<{ theme: Theme }>(props => ({
	keyboardAppearance: props.theme.keyboardAppearance,
}))`
	color: ${(props): string => props.theme.colors.textSecondary};
	font-family: ${fontFamily};
	font-size: 17px;
	font-weight: 400;
	line-height: 22px;
	letter-spacing: 0.4px;
	padding-left: 24px;
	padding-right: 24px;
	include-font-padding: false;
`;

export const TextInput = StyledTextInput as ComponentType<TextInputProps & RefAttributes<NativeTextInput>>;

export const TouchableOpacity = styled.TouchableOpacity<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
`;

export const ActivityIndicator = styled.ActivityIndicator<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.textTertiary};
`;

export const Divider = styled.View<BackgroundColorProps>`
	background-color: 'rgba(255, 255, 255, 0.16)';
	height: 1px;
	width: 100%;
`;

export const CardGradient = styled(LinearGradient).attrs<{ theme: Theme }>(props => ({
	colors: props.theme.colors.cardGradient,
}))``;
