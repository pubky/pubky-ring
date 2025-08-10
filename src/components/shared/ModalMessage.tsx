import React from 'react';
import { StyleSheet } from 'react-native';
import { SessionText } from '../../theme/components';
import { textStyles } from '../../theme/utils';

interface ModalMessageProps {
	children: string;
	style?: any;
	centered?: boolean;
}

const ModalMessage: React.FC<ModalMessageProps> = ({ 
	children, 
	style, 
	centered = false 
}) => {
	return (
		<SessionText style={[
			styles.message, 
			centered && styles.centered, 
			style
		]}>
			{children}
		</SessionText>
	);
};

const styles = StyleSheet.create({
	message: {
		...textStyles.body,
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '400',
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	centered: {
		textAlign: 'center',
		alignSelf: 'center',
	},
});

export default ModalMessage;