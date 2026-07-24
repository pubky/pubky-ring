import React, { memo, ReactElement, ReactNode } from 'react';
import { InputAccessoryView, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface KeyboardAccessoryProps {
	accessoryIds: string[];
	children: ReactNode | (() => ReactNode);
	visible: boolean;
	bottom?: number;
	containerStyle?: StyleProp<ViewStyle>;
	androidContainerStyle?: StyleProp<ViewStyle>;
	emptyStyle?: StyleProp<ViewStyle>;
}

const KeyboardAccessory = ({
	accessoryIds,
	children,
	visible,
	bottom = 0,
	containerStyle,
	androidContainerStyle,
	emptyStyle,
}: KeyboardAccessoryProps): ReactElement | null => {
	const renderContent = (): ReactNode => (typeof children === 'function' ? children() : children);

	if (Platform.OS === 'ios') {
		return (
			<>
				{accessoryIds.map(accessoryId => (
					<InputAccessoryView key={accessoryId} nativeID={accessoryId}>
						<View style={visible ? containerStyle : [styles.emptyAccessory, emptyStyle]}>
							{visible ? renderContent() : null}
						</View>
					</InputAccessoryView>
				))}
			</>
		);
	}

	if (!visible) {
		return null;
	}

	return (
		<View style={[styles.androidAccessory, { bottom }, containerStyle, androidContainerStyle]}>
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
	emptyAccessory: {
		height: 0,
	},
});

export default memo(KeyboardAccessory);
