import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../../theme/components';
import { textStyles } from '../../theme/utils';

interface ModalTitleProps {
	children: string;
	style?: any;
}

const ModalTitle: React.FC<ModalTitleProps> = ({ children, style }) => {
	return (
		<Text style={[styles.title, style]}>
			{children}
		</Text>
	);
};

const styles = StyleSheet.create({
	title: {
		...textStyles.heading,
		fontSize: 17,
		fontWeight: '700',
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
		backgroundColor: 'transparent',
	},
});

export default ModalTitle;
