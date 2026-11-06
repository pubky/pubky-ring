import React, { ReactElement } from 'react';
import { Keyboard, TouchableWithoutFeedback, View, type ViewProps } from 'react-native';

const KeyboardDismissView = ({ children, ...props }: ViewProps): ReactElement => (
	<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
		<View {...props}>{children}</View>
	</TouchableWithoutFeedback>
);

export default KeyboardDismissView;
