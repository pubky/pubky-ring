import React, { ReactElement, useCallback, memo } from 'react';
import { StyleSheet } from 'react-native';
import { View, Text, ArrowRight, Plus, Button } from '../theme/components.ts';
import { showAddPubkySheet } from '../utils/sheetHelpers';
import { textStyles, buttonStyles } from '../theme/utils';
import { usePubkyManagement } from '../hooks/usePubkyManagement';

const EmptyState = (): ReactElement => {
	const { createPubky, importPubky } = usePubkyManagement();

	const onPress = useCallback(() => {
		showAddPubkySheet(createPubky, importPubky);
	}, [createPubky, importPubky]);

	return (
		<View style={styles.container}>
			<View style={styles.cardEmpty}>
				<View style={styles.emptyUser}>
					<View style={styles.image} />
					<View>
						<Text style={[textStyles.heading, styles.name]}>pubky</Text>
						<Text style={[textStyles.body, styles.pubky]}>pk:xxxxx..xxxxx</Text>
					</View>
					<View style={styles.buttonArrow}>
						<ArrowRight size={24} />
					</View>
				</View>
				<Button
					testID="EmptyStateAddPubkyButton"
					style={[buttonStyles.primary, styles.buttonSecondary]}
					onPressIn={onPress}
				>
					<Plus size={16} />
					<Text style={textStyles.button}>Add pubky</Text>
				</Button>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	cardEmpty: {
		display: 'flex',
		padding: 24,
		marginHorizontal: 20,
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: 24,
		alignSelf: 'stretch',
		borderRadius: 16,
		borderWidth: 1,
		borderStyle: 'dashed',
	},
	emptyUser: {
		display: 'flex',
		flexDirection: 'row',
		gap: 18,
		alignSelf: 'stretch',
	},
	image: {
		width: 48,
		height: 48,
		borderRadius: 24,
		borderWidth: 1,
		borderStyle: 'dashed',
	},
	name: {},
	pubky: {},
	buttonArrow: {
		display: 'flex',
		justifyContent: 'center',
		marginLeft: 'auto',
	},
	buttonSecondary: {
		width: '100%',
		display: 'flex',
		flexDirection: 'row',
		gap: 4,
		justifyContent: 'center',
	},
});

export default memo(EmptyState);
