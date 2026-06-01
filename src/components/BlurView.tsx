import React, { ReactElement } from 'react';
import { Platform, ViewProps, View } from 'react-native';
import { BlurView as Blur } from '@react-native-community/blur';

type BlurViewProps = ViewProps & {
	pressed?: boolean;
	tintEnabled?: boolean;
};

const BlurView = ({ pressed, tintEnabled, style, ...props }: BlurViewProps): ReactElement => {
	const backgroundStyle = { backgroundColor: tintEnabled ? 'rgba(42, 42, 42, 0.95)' : 'transparent' };

	return Platform.OS === 'ios' ? (
		// Patched via patches/@react-native-community+blur+4.4.1.patch to remove native tint/saturation.
		<Blur {...props} style={style} blurType="dark" blurAmount={pressed ? 8 : 4} />
	) : (
		// Android blur is unreliable in React Native, so optionally use a deterministic tint fallback.
		<View {...props} style={[backgroundStyle, style]} />
	);
};

export default BlurView;
