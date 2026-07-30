import React, { ComponentType, memo } from 'react';
import { useTheme } from 'styled-components/native';
import type { IconProps } from './types';

export const createIcon = (LucideIcon: ComponentType<IconProps>): React.NamedExoticComponent<IconProps> => {
	const Icon = ({ color, colorName = 'foreground', size = 24, ...props }: IconProps): React.ReactElement => {
		const theme = useTheme();
		const iconColor = color ?? theme.colors[colorName];

		return <LucideIcon color={iconColor} size={size} {...props} />;
	};

	Icon.displayName = `Icon(${LucideIcon.displayName ?? LucideIcon.name ?? 'Lucide'})`;

	return memo(Icon);
};
