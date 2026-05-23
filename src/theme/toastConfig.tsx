import React, { useMemo } from 'react';
import { StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import styled from 'styled-components/native';
import { BaseToast, ErrorToast, InfoToast, SuccessToast, ToastProps } from 'react-native-toast-message';
import { useTheme } from 'styled-components/native';
import { Theme } from './';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontFamily } from './fonts';

interface ThemedProps {
	theme: Theme;
}

const StyledBaseToast = styled(BaseToast)<ThemedProps>`
	background-color: ${(props: ThemedProps): string => props.theme.colors.cardBackground};
	border-left-color: ${(props: ThemedProps): string => props.theme.colors.border};
`;

const StyledErrorToast = styled(ErrorToast)<ThemedProps>`
	background-color: ${(props: ThemedProps): string => props.theme.colors.cardBackground};
	border-left-color: #FF0000;
`;

const StyledSuccessToast = styled(SuccessToast)<ThemedProps>`
	background-color: ${(props: ThemedProps): string => props.theme.colors.cardBackground};
	border-left-color: #16a34a;
`;

const StyledInfoToast = styled(InfoToast)<ThemedProps>`
	background-color: ${(props: ThemedProps): string => props.theme.colors.cardBackground};
	border-left-color: #2563eb;
`;

interface ToastComponentProps extends ToastProps {
	contentContainerStyle?: StyleProp<ViewStyle>;
	text1Style?: StyleProp<TextStyle>;
	text2Style?: StyleProp<TextStyle>;
	style?: StyleProp<ViewStyle>;
}

const createThemedToast = (
	ToastComponent: React.ComponentType<ToastComponentProps>,
): React.FC<ToastComponentProps> => {
	return React.memo((props: ToastComponentProps): React.ReactElement => {
		const insets = useSafeAreaInsets();
		const theme = useTheme() as Theme;
		const styles = useMemo(
			() =>
				StyleSheet.create({
					// eslint-disable-next-line react-native/no-unused-styles
					text1: {
						fontFamily,
						fontSize: 15,
						fontWeight: '600',
						lineHeight: 20,
						letterSpacing: 0.4,
						color: theme.colors.textPrimary,
					},
					// eslint-disable-next-line react-native/no-unused-styles
					text2: {
						fontFamily,
						fontSize: 15,
						fontWeight: '400',
						lineHeight: 20,
						letterSpacing: 0,
						color: theme.colors.textSecondary,
					},
					// eslint-disable-next-line react-native/no-unused-styles
					contentContainer: {
						paddingHorizontal: 15,
					},
					// eslint-disable-next-line react-native/no-unused-styles
					toastContainer: {
						marginTop: insets.top,
					},
				}),
			[theme.colors.textPrimary, theme.colors.textSecondary, insets.top],
		);

		return (
			<ToastComponent
				{...props}
				contentContainerStyle={styles.contentContainer}
				text1Style={styles.text1}
				text2Style={styles.text2}
				style={[styles.toastContainer, props.style]}
			/>
		);
	});
};

const ThemedSuccessToast = createThemedToast(
	StyledSuccessToast as unknown as React.ComponentType<ToastComponentProps>,
);
const ThemedErrorToast = createThemedToast(
	StyledErrorToast as unknown as React.ComponentType<ToastComponentProps>,
);
const ThemedInfoToast = createThemedToast(
	StyledInfoToast as unknown as React.ComponentType<ToastComponentProps>,
);
const ThemedBaseToast = createThemedToast(
	StyledBaseToast as unknown as React.ComponentType<ToastComponentProps>,
);

type ToastConfigReturn = {
	[key in 'success' | 'error' | 'info' | 'any']: (props: ToastProps) => React.ReactElement;
};

export const toastConfig = (): ToastConfigReturn => {
	return {
		success: (props: ToastProps): React.ReactElement => <ThemedSuccessToast {...props} />,
		error: (props: ToastProps): React.ReactElement => <ThemedErrorToast {...props} />,
		info: (props: ToastProps): React.ReactElement => <ThemedInfoToast {...props} />,
		any: (props: ToastProps): React.ReactElement => <ThemedBaseToast {...props} />,
	};
};
