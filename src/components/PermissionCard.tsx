import React, { memo, ReactElement } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from 'styled-components/native';
import { Theme } from '../theme';
import { shadows } from '../theme/shadows';

const PermissionCard = ({ style, children, ...props }: ViewProps): ReactElement => {
	const theme = useTheme() as Theme;
	const themeStyles = { backgroundColor: theme.colors.popover, borderColor: theme.colors.border };

	return (
		<View style={[styles.container, themeStyles, style]} {...props}>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		...shadows.xl,
	},
});

export default memo(PermissionCard);
