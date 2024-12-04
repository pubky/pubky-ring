import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '../theme/components.ts';

const EmptyState = (): ReactElement => (
	<View style={styles.container}>
		<Text style={styles.title}>
			Welcome to Pubky Ring!
		</Text>
		<Text style={styles.description}>
			Tap the plus button below to create your first Pubky
		</Text>
		<Text style={styles.description}>
			Long-press the plus button below to import an existing Pubky
		</Text>
	</View>
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
		marginBottom: 16,
	},
	description: {
		fontSize: 20,
		textAlign: 'center',
		paddingHorizontal: 32,
		marginBottom: 34,
	},
});

export default EmptyState;
