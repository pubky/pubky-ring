import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../../theme/components';

interface ModalButtonContainerProps {
	children: ReactNode;
	single?: boolean;
	style?: any;
}

const ModalButtonContainer: React.FC<ModalButtonContainerProps> = ({ 
	children, 
	single = false,
	style 
}) => {
	return (
		<View style={[
			styles.buttonContainer, 
			single && styles.singleButton,
			style
		]}>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	buttonContainer: {
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		alignSelf: 'center',
		justifyContent: 'space-around',
		gap: 12,
		paddingVertical: 12,
		backgroundColor: 'transparent',
	},
	singleButton: {
		justifyContent: 'center',
	},
});

export default ModalButtonContainer;