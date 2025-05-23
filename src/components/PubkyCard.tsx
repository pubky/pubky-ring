import { StyleSheet } from 'react-native';
import { Card, LinearGradient, Text } from '../theme/components.ts';
import React, { memo, ReactElement } from 'react';
import ProfileAvatar from './ProfileAvatar.tsx';

const PubkyCard = ({ name, publicKey }: { name?: string; publicKey: string }): ReactElement => {
	return (
		<LinearGradient style={styles.pubkyCard}>
			<Card style={styles.pubkyRow}>
				<Card style={styles.iconContainer}>
					<ProfileAvatar pubky={publicKey} size={38} />
				</Card>
				<Card style={styles.pubkyTextContainer}>
					{name &&
					<Text style={styles.pubkyName}>
						{name}
					</Text>}
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
	pubkyName: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	pubkyText: {
		fontWeight: '600',
		fontSize: 15,
		lineHeight: 20,
	},
});

export default memo(PubkyCard);
