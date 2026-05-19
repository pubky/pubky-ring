import type { SvgProps } from 'react-native-svg';
import type { Theme } from '../theme';

export type IconColorName = {
	[Name in keyof Theme['colors']]: Theme['colors'][Name] extends string ? Name : never;
}[keyof Theme['colors']];

export type IconProps = SvgProps & {
	colorName?: IconColorName;
	color?: string;
	size?: number;
};
