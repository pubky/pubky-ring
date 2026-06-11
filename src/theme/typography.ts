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
	colorName = 'textPrimary',
	theme,
}: TypographyProps & { theme: Theme }): string => {
	return color ?? theme.colors[colorName];
};

const BaseText = styled.Text<TypographyProps>`
	color: ${textColor};
	font-family: ${fontFamily};
`;

export const DisplayText = styled(BaseText)`
	font-size: 48px;
	font-weight: 700;
	line-height: ${Platform.OS === 'ios' ? '48px' : '58px'};
`;

export const HeadingText = styled(BaseText)`
	font-size: 26px;
	font-weight: 300;
	line-height: ${Platform.OS === 'ios' ? '26px' : '32px'};
`;

export const BodyMText = styled(BaseText).attrs<TypographyProps>(props => ({
	colorName: props.colorName ?? 'textSecondary',
}))`
	font-size: 17px;
	font-weight: 400;
	line-height: 22px;
`;

export const BodyMSpacedText = styled(BaseText)`
	font-size: 17px;
	font-weight: 400;
	line-height: 22px;
	letter-spacing: 0.4px;
`;

export const BodyMSBText = styled(BaseText)`
	font-size: 17px;
	font-weight: 600;
	line-height: 22px;
	letter-spacing: 0.4px;
`;

export const BodyMSBUnspacedText = styled(BaseText)`
	font-size: 17px;
	font-weight: 600;
	line-height: 22px;
`;

export const BodyMBText = styled(BaseText)`
	font-size: 17px;
	font-weight: 700;
	line-height: 22px;
	letter-spacing: 0.4px;
`;

export const BodySText = styled(BaseText)`
	font-size: 15px;
	font-weight: 400;
	line-height: 20px;
`;

export const BodySSpacedText = styled(BaseText)`
	font-size: 15px;
	font-weight: 400;
	line-height: 20px;
	letter-spacing: 0.4px;
`;

export const BodySMText = styled(BaseText)`
	font-size: 15px;
	font-weight: 500;
	line-height: 20px;
`;

export const BodySSBText = styled(BaseText)`
	font-size: 15px;
	font-weight: 600;
	line-height: 20px;
	letter-spacing: 0.4px;
`;

export const BodySSBUnspacedText = styled(BaseText)`
	font-size: 15px;
	font-weight: 600;
	line-height: 20px;
`;

export const CaptionText = styled(BaseText).attrs<TypographyProps>(props => ({
	colorName: props.colorName ?? 'textTertiary',
}))`
	font-size: 13px;
	font-weight: 500;
	line-height: 18px;
	letter-spacing: 1px;
	text-transform: uppercase;
`;

export const CaptionSBText = styled(BaseText)`
	font-size: 13px;
	font-weight: 600;
	line-height: 18px;
`;

export const CaptionSBSpacedText = styled(BaseText)`
	font-size: 13px;
	font-weight: 600;
	line-height: 18px;
	letter-spacing: 0.2px;
`;

export const CaptionBText = styled(BaseText)`
	font-size: 13px;
	font-weight: 700;
	line-height: 18px;
	letter-spacing: 1px;
	text-transform: uppercase;
`;
