import styled from 'styled-components/native';
import { Theme, ThemeColorName } from './index';

interface BackgroundColorProps {
	colorName?: ThemeColorName;
}

const backgroundColor =
	(defaultColorName: ThemeColorName) =>
	({ colorName, theme }: BackgroundColorProps & { theme: Theme }): string => {
		return theme.colors[colorName ?? defaultColorName];
	};

export const ThemedView = styled.View<BackgroundColorProps>`
	background-color: ${backgroundColor('background')};
`;

export const ActivityIndicator = styled.ActivityIndicator<{ theme: Theme }>`
	color: ${(props): string => props.theme.colors.mutedForeground};
`;

export const Divider = styled.View<BackgroundColorProps>`
	background-color: 'rgba(255, 255, 255, 0.16)';
	height: 1px;
	width: 100%;
`;
