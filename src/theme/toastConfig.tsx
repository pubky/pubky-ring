import React, { useMemo } from 'react';
import { StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import styled from 'styled-components/native';
import { BaseToast, ErrorToast, InfoToast, SuccessToast, ToastProps } from 'react-native-toast-message';
import { useTheme } from 'styled-components/native';
import { Theme } from './';

type ToastConfigStyle = {
    style?: StyleProp<ViewStyle>;
};

interface ThemedProps {
    theme: Theme;
}

const StyledBaseToast = styled(BaseToast)<ThemedProps>`
    background-color: ${(props: ThemedProps): string => props.theme.colors.cardBackground};
    border-left-color: ${(props: ThemedProps): string => props.theme.colors.border};
`;

const StyledErrorToast = styled(ErrorToast)<ThemedProps>`
    background-color: ${(props: ThemedProps): string => props.theme.colors.cardBackground};
    border-left-color: #dc2626;
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
	ToastComponent: React.ComponentType<ToastComponentProps>
): React.FC<ToastComponentProps> => {
	return React.memo((props: ToastComponentProps): React.ReactElement => {
		const theme = useTheme() as Theme;
		const styles = useMemo(() => StyleSheet.create({
			// eslint-disable-next-line react-native/no-unused-styles
			text1: {
				fontSize: 15,
				fontWeight: '600',
				color: theme.colors.text,
			},
			// eslint-disable-next-line react-native/no-unused-styles
			text2: {
				fontSize: 13,
				fontWeight: '400',
				color: theme.colors.sessionText,
			},
			// eslint-disable-next-line react-native/no-unused-styles
			contentContainer: {
				paddingHorizontal: 15,
			},
		}), [theme.colors.text, theme.colors.sessionText]);

		return (
			<ToastComponent
				{...props}
				contentContainerStyle={styles.contentContainer}
				text1Style={styles.text1}
				text2Style={styles.text2}
			/>
		);
	});
};

const ThemedSuccessToast = createThemedToast(StyledSuccessToast);
const ThemedErrorToast = createThemedToast(StyledErrorToast);
const ThemedInfoToast = createThemedToast(StyledInfoToast);
const ThemedBaseToast = createThemedToast(StyledBaseToast);

type ToastConfigReturn = {
	[key in 'success' | 'error' | 'info' | 'any']: (props: ToastProps) => React.ReactElement;
};

export const toastConfig = ({ style = {} }: ToastConfigStyle = {}): ToastConfigReturn => ({
	success: (props: ToastProps): React.ReactElement => (
		<ThemedSuccessToast {...props} style={style} />
	),
	error: (props: ToastProps): React.ReactElement => (
		<ThemedErrorToast {...props} style={style} />
	),
	info: (props: ToastProps): React.ReactElement => (
		<ThemedInfoToast {...props} style={style} />
	),
	any: (props: ToastProps): React.ReactElement => (
		<ThemedBaseToast {...props} style={style} />
	),
});
