import { BlurView as Blur } from '@react-native-community/blur';
import React, { memo, ReactElement, ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

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
	return (
		<Blur
			{...props}
			style={style}
			blurAmount={pressed ? 10 : 4}
		/>
	);
};

export default memo(BlurView);
