import React, { memo, ReactElement } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import BlurView from './BlurView.tsx';
import { Theme } from '../theme/index.ts';

const CardGradient = styled(LinearGradient).attrs<{ theme: Theme }>(props => ({
	colors: props.theme.colors.cardGradient,
}))``;

const Card = ({ style, children, ...props }: ViewProps): ReactElement => {
	return (
		<View style={[styles.container, style]} {...props}>
			<CardGradient style={styles.gradientBackground} pointerEvents="none" />
			<BlurView style={styles.blurBackground} pointerEvents="none" />

			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 24,
		borderRadius: 16,
		overflow: 'hidden',
	},
	gradientBackground: {
		...StyleSheet.absoluteFill,
	},
	blurBackground: {
		...StyleSheet.absoluteFill,
	},
});

export default memo(Card);
