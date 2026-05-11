import React, { ReactElement } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BOTTOM_FALLBACK_PADDING = 24;
const BOTTOM_EXTRA_PADDING = 12;

const SafeAreaInset = ({ edge }: { edge: 'top' | 'bottom' }): ReactElement => {
	const insets = useSafeAreaInsets();

	if (edge === 'bottom') {
		const padding = insets.bottom > 0 ? insets.bottom + BOTTOM_EXTRA_PADDING : BOTTOM_FALLBACK_PADDING;

		return <View style={{ paddingBottom: padding }} />;
	}

	return <View style={{ paddingTop: insets.top }} />;
};

export default SafeAreaInset;
