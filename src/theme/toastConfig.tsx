import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { BaseToast, ErrorToast, InfoToast, SuccessToast, ToastProps } from 'react-native-toast-message';
import { useTheme } from 'styled-components/native';
import { Theme } from './';

const StyledBaseToast = styled(BaseToast)`
    background-color: ${(props): string => props.theme.colors.cardBackground};
    border-left-color: ${(props): string => props.theme.colors.border};
`;

const StyledErrorToast = styled(ErrorToast)`
    background-color: ${(props): string => props.theme.colors.cardBackground};
    border-left-color: #dc2626;
`;

const StyledSuccessToast = styled(SuccessToast)`
    background-color: ${(props): string => props.theme.colors.cardBackground};
    border-left-color: #16a34a;
`;

const StyledInfoToast = styled(InfoToast)`
    background-color: ${(props): string => props.theme.colors.cardBackground};
    border-left-color: #2563eb;
`;

// Create toast components that use the theme
const ThemedSuccessToast = React.memo((props: any) => {
	const theme = useTheme() as Theme;
	const styles = useMemo(() => StyleSheet.create({
		text1: {
			fontSize: 15,
			fontWeight: '600',
			color: theme.colors.text,
		},
		text2: {
			fontSize: 13,
			fontWeight: '400',
			color: theme.colors.sessionText,
		},
		contentContainer: {
			paddingHorizontal: 15,
		},
	}), [theme.colors.text, theme.colors.sessionText]);

	return (
		<StyledSuccessToast
			{...props}
			contentContainerStyle={styles.contentContainer}
			text1Style={styles.text1}
			text2Style={styles.text2}
		/>
	);
});

const ThemedErrorToast = React.memo((props: any) => {
	const theme = useTheme() as Theme;
	const styles = useMemo(() => StyleSheet.create({
		text1: {
			fontSize: 15,
			fontWeight: '600',
			color: theme.colors.text,
		},
		text2: {
			fontSize: 13,
			fontWeight: '400',
			color: theme.colors.sessionText,
		},
		contentContainer: {
			paddingHorizontal: 15,
		},
	}), [theme.colors.text, theme.colors.sessionText]);

	return (
		<StyledErrorToast
			{...props}
			contentContainerStyle={styles.contentContainer}
			text1Style={styles.text1}
			text2Style={styles.text2}
		/>
	);
});

const ThemedInfoToast = React.memo((props: any) => {
	const theme = useTheme() as Theme;
	const styles = useMemo(() => StyleSheet.create({
		text1: {
			fontSize: 15,
			fontWeight: '600',
			color: theme.colors.text,
		},
		text2: {
			fontSize: 13,
			fontWeight: '400',
			color: theme.colors.sessionText,
		},
		contentContainer: {
			paddingHorizontal: 15,
		},
	}), [theme.colors.text, theme.colors.sessionText]);

	return (
		<StyledInfoToast
			{...props}
			contentContainerStyle={styles.contentContainer}
			text1Style={styles.text1}
			text2Style={styles.text2}
		/>
	);
});

const ThemedBaseToast = React.memo((props: any) => {
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
		<StyledBaseToast
			{...props}
			contentContainerStyle={styles.contentContainer}
			text1Style={styles.text1}
			text2Style={styles.text2}
		/>
	);
});

export const toastConfig = {
	success: (props: ToastProps): React.ReactElement => <ThemedSuccessToast {...props} />,
	error: (props: ToastProps): React.ReactElement => <ThemedErrorToast {...props} />,
	info: (props: ToastProps): React.ReactElement => <ThemedInfoToast {...props} />,
	any: (props: ToastProps): React.ReactElement => <ThemedBaseToast {...props} />,
};
