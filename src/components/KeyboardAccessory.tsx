import React, { memo, ReactElement, ReactNode } from 'react';
import { InputAccessoryView, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAccessoryProps {
	accessoryIds: string[];
	children: ReactNode | (() => ReactNode);
	visible: boolean;
	containerStyle?: StyleProp<ViewStyle>;
	androidContainerStyle?: StyleProp<ViewStyle>;
}

const KeyboardAccessory = ({
	accessoryIds,
	children,
	visible,
	containerStyle,
	androidContainerStyle,
}: KeyboardAccessoryProps): ReactElement | null => {
	const insets = useSafeAreaInsets();
	const renderContent = (): ReactNode => (typeof children === 'function' ? children() : children);

	if (Platform.OS === 'ios') {
		return (
			<>
				{accessoryIds.map(accessoryId => (
					<InputAccessoryView key={accessoryId} nativeID={accessoryId}>
						<View style={visible && containerStyle}>{visible ? renderContent() : null}</View>
					</InputAccessoryView>
				))}
			</>
		);
	}

	if (!visible) {
		return null;
	}

	return (
		<View style={[styles.androidAccessory, { bottom: insets.bottom }, containerStyle, androidContainerStyle]}>
			{renderContent()}
		</View>
	);
};

const styles = StyleSheet.create({
	androidAccessory: {
		position: 'absolute',
		left: 0,
		right: 0,
		zIndex: 2,
		elevation: 2,
	},
});

export default memo(KeyboardAccessory);
