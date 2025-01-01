import { StyleSheet } from 'react-native';
import { Card, SessionText } from '../theme/components.ts';
import Jdenticon from './Jdenticon.tsx';
import React, { memo, ReactElement } from 'react';

const PubkyCard = ({ publicKey }: { publicKey: string }): ReactElement => {
	return (
		<Card style={styles.pubkyCard}>
			<Card style={styles.pubkyRow}>
				<Card style={styles.iconContainer}>
					<Jdenticon value={publicKey} size={38} />
				</Card>
				<Card style={styles.pubkyTextContainer}>
					<SessionText style={styles.pubkyText} numberOfLines={2}>
						pk:{publicKey}
					</SessionText>
				</Card>
			</Card>
		</Card>
	);
};

const styles = StyleSheet.create({
	pubkyCard: {
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 20,
		marginBottom: 24,
	},
	pubkyRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconContainer: {
		width: 38,
		height: 38,
		marginRight: 12,
	},
	pubkyTextContainer: {
		flex: 1,
	},
	pubkyText: {
		fontWeight: '600',
		fontSize: 15,
		lineHeight: 20,
	},
});

export default memo(PubkyCard);
