import { StyleSheet } from 'react-native';
import { Card, LinearGradient, Text } from '../theme/components.ts';
import Jdenticon from './Jdenticon.tsx';
import React, { memo, ReactElement } from 'react';

const PubkyCard = ({ publicKey }: { publicKey: string }): ReactElement => {
	return (
		<LinearGradient style={styles.pubkyCard}>
			<Card style={styles.pubkyRow}>
				<Card style={styles.iconContainer}>
					<Jdenticon value={publicKey} size={38} />
				</Card>
				<Card style={styles.pubkyTextContainer}>
					<Text style={styles.pubkyText} numberOfLines={2}>
						pk:{publicKey}
					</Text>
				</Card>
			</Card>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	pubkyCard: {
		borderRadius: 16,
		marginBottom: 24,
		minHeight: 88,
	},
	pubkyRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		justifyContent: 'center',
		paddingHorizontal: 16,
		backgroundColor: 'transparent',
	},
	iconContainer: {
		width: 38,
		height: 38,
		marginRight: 12,
	},
	pubkyTextContainer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	pubkyText: {
		fontWeight: '600',
		fontSize: 15,
		lineHeight: 20,
	},
});

export default memo(PubkyCard);
