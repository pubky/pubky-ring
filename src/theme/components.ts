import { ComponentType, RefAttributes } from 'react';
import { TextInput as NativeTextInput, TextInputProps } from 'react-native';
import styled from 'styled-components/native';
import { Theme, ThemeColorName } from './index';
import Animated from 'react-native-reanimated';
import { LinearGradient as _LinearGradient } from 'react-native-linear-gradient';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';
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

const StyledTextInput = styled.TextInput<{ theme: Theme }>`
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

export const AnimatedView = styled(Animated.View)<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
	border-color: ${(props): string => props.theme.colors.textPrimary};
`;

export const TouchableOpacity = styled.TouchableOpacity<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
`;

export const NavView = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.navButton};
`;

export const ScrollView = styled.ScrollView<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.background};
`;

export const SessionBox = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.cardBackground};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const Card = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.buttonBackground};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const CardView = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.buttonBackground};
`;

export const SessionView = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.cardBackground};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const Box = styled.TouchableOpacity<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.foreground};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const ForegroundView = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.foreground};
`;

export const AvatarRing = styled.View<{ theme: Theme }>`
	background-color: ${(props): string => props.theme.colors.avatarRing};
	border-color: ${(props): string => props.theme.colors.border};
`;

export const ActivityIndicator = styled.ActivityIndicator<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.textTertiary};
`;

export const Divider = styled.View<BackgroundColorProps>`
	background-color: 'rgba(255, 255, 255, 0.16)';
	height: 1px;
	width: 100%;
`;

interface LinearGradientProps {
	colors?: string[];
	modal?: boolean;
	theme: Theme;
}

export const LinearGradient = styled(_LinearGradient).attrs<LinearGradientProps>(props => ({
	colors:
		props.colors || (props.modal ? props.theme.colors.defaultGradient : props.theme.colors.defaultGradient),
}))``;
