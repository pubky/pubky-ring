import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

const HEADER_HIT_SLOP = { top: 20, bottom: 20, left: 20, right: 20 };

type HeaderNavButtonProps = {
	children?: ReactElement | null;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: PressableProps['testID'];
	onPressIn?: () => void;
};

const HeaderNavButton = ({
	children = null,
	disabled = false,
	style,
	testID,
	onPressIn,
}: HeaderNavButtonProps): ReactElement => (
	<TouchableOpacity
		style={[styles.root, style]}
		hitSlop={HEADER_HIT_SLOP}
		disabled={disabled}
		testID={testID}
		onPressIn={onPressIn}
	>
		{children}
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	root: {
		zIndex: 1,
		height: 40,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(HeaderNavButton);
