import { StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Card, LinearGradient, Text } from '../theme/components.ts';
import React, { memo, ReactElement } from 'react';
import ProfileAvatar from './ProfileAvatar.tsx';

interface PubkyCardProps {
	name?: string;
	publicKey: string;
	style?: StyleProp<ViewStyle>;
	containerStyle?: StyleProp<ViewStyle>;
	nameStyle?: StyleProp<TextStyle>;
	pubkyTextStyle?: StyleProp<TextStyle>;
	avatarSize?: number;
	avatarStyle?: StyleProp<ViewStyle>;
}

const PubkyCard = ({
	name,
	publicKey,
	style,
	containerStyle,
	nameStyle,
	pubkyTextStyle,
	avatarSize = 38,
	avatarStyle
}: PubkyCardProps): ReactElement => {
	return (
		<LinearGradient style={[styles.pubkyCard, style]}>
			<Card style={[styles.pubkyRow, containerStyle]}>
				<Card style={[styles.iconContainer, avatarStyle]}>
					<ProfileAvatar pubky={publicKey} size={avatarSize} />
				</Card>
				<Card style={styles.pubkyTextContainer}>
					{name &&
					<Text style={[styles.pubkyName, nameStyle]}>
						{name}
					</Text>}
					<Text style={[styles.pubkyText, pubkyTextStyle]} numberOfLines={2}>
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
