import type { SvgProps } from 'react-native-svg';
import type { ThemeColorName } from '../theme';

export type IconProps = SvgProps & {
	colorName?: ThemeColorName;
	color?: string;
	size?: number;
};
