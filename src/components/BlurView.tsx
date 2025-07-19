import { BlurView as Blur } from '@react-native-community/blur';
import React, { memo, ReactElement, ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { View } from '../theme/components';

type BlurViewProps = {
	pressed?: boolean;
	style?: StyleProp<ViewStyle>;
	children?: ReactNode;
};

const BlurView = ({
	pressed,
	style,
	...props
}: BlurViewProps): ReactElement => {
	return Platform.OS === 'ios' ? (
		<Blur
			{...props}
			style={[styles.ios, style]}
			blurAmount={pressed ? 10 : 4}
		/>
	) : (
		<View
			{...props}
			style={[styles.android, style, pressed && styles.androidPressed]}
		/>
	);
};

const styles = StyleSheet.create({
	ios: {},
	android: {
		backgroundColor: 'rgba(20, 20, 20, 0.95)',
	},
	androidPressed: {
		backgroundColor: 'rgba(20, 20, 20, 1)',
	},
});

export default memo(BlurView);
