import { Platform } from 'react-native';
import styled from 'styled-components/native';
import { Theme, ThemeColorName } from './index';
import { fontFamily } from './fonts';

interface TypographyProps {
	color?: string;
	colorName?: ThemeColorName;
}

const textColor = ({
	color,
	colorName = 'foreground',
	theme,
}: TypographyProps & { theme: Theme }): string => {
	return color ?? theme.colors[colorName];
};

const BaseText = styled.Text<TypographyProps>`
	color: ${textColor};
	font-family: ${fontFamily};
`;

export const Text5Xl = styled(BaseText)`
	font-size: 48px;
	line-height: ${Platform.OS === 'ios' ? '48px' : '58px'};
	font-weight: 700;
`;

export const Text2Xl = styled(BaseText)`
	font-size: 24px;
	line-height: 32px;
	font-weight: 300;
`;

export const TextXlB = styled(BaseText)`
	font-size: 20px;
	line-height: 28px;
	font-weight: 700;
`;

export const TextLgSb = styled(BaseText)`
	font-size: 18px;
	line-height: 24px;
	font-weight: 600;
`;

export const TextBaseM = styled(BaseText).attrs<TypographyProps>(props => ({
	colorName: props.colorName ?? 'secondaryForeground',
}))`
	font-size: 16px;
	line-height: 24px;
	font-weight: 500;
`;

export const TextBaseB = styled(BaseText)`
	font-size: 16px;
	line-height: 24px;
	font-weight: 700;
`;

export const TextSmM = styled(BaseText).attrs<TypographyProps>(props => ({
	colorName: props.colorName ?? 'mutedForeground',
}))`
	font-size: 14px;
	line-height: 20px;
	font-weight: 500;
`;

export const TextSmB = styled(BaseText)`
	font-size: 14px;
	line-height: 20px;
	font-weight: 700;
`;

export const TextXsM = styled(BaseText).attrs<TypographyProps>(props => ({
	colorName: props.colorName ?? 'mutedForeground',
}))`
	font-size: 12px;
	line-height: 16px;
	font-weight: 500;
	letter-spacing: 1px;
	text-transform: uppercase;
`;

export const TextXsSb = styled(BaseText)`
	font-size: 12px;
	line-height: 16px;
	font-weight: 600;
`;

export const TextXsB = styled(BaseText)`
	font-size: 12px;
	line-height: 16px;
	font-weight: 700;
`;
