import React, { ComponentType, memo } from 'react';
import { useTheme } from 'styled-components/native';
import type { SvgProps } from 'react-native-svg';
import type { IconProps } from './types';

export const createIcon = (SvgIcon: ComponentType<SvgProps>): React.NamedExoticComponent<IconProps> => {
	const Icon = ({ color, colorName = 'textPrimary', size = 24, ...props }: IconProps): React.ReactElement => {
		const theme = useTheme();
		const iconColor = color ?? theme.colors[colorName];

		return <SvgIcon color={iconColor} height={size} width={size} {...props} />;
	};

	Icon.displayName = `Icon(${SvgIcon.displayName ?? SvgIcon.name ?? 'Svg'})`;

	return memo(Icon);
};
