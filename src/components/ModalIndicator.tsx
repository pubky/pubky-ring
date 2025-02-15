import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../theme/components';

const ModalIndicator = (): ReactElement => {
	return (
		<View style={styles.container}>
			<View style={styles.indicator} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		width: '100%',
		backgroundColor: 'transparent',
		marginVertical: 20,
	},
	indicator: {
		width: 32,
		height: 4,
		backgroundColor: '#ccc', // Or your desired color
		borderRadius: 2,
	},
});

export default memo(ModalIndicator);
