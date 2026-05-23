import { StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Card, LinearGradient } from '../theme/components.ts';
import React, { memo, ReactElement } from 'react';
import ProfileAvatar from './ProfileAvatar.tsx';
import { BodySSBText, HeadingText } from '../theme/typography';
import { truncatePubky } from '../utils/pubky.ts';

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
	avatarStyle,
}: PubkyCardProps): ReactElement => {
	return (
		<LinearGradient style={[styles.pubkyCard, style]}>
			<Card style={[styles.pubkyRow, containerStyle]}>
				<Card style={[styles.iconContainer, avatarStyle]}>
					<ProfileAvatar pubky={publicKey} size={avatarSize} />
				</Card>
				<Card style={styles.pubkyTextContainer}>
					{name && <HeadingText style={nameStyle}>{name}</HeadingText>}
					<BodySSBText style={pubkyTextStyle} numberOfLines={2}>
						{truncatePubky(publicKey)}
					</BodySSBText>
				</Card>
			</Card>
		</LinearGradient>
	);
};

const styles = StyleSheet.create({
	pubkyCard: {
		borderRadius: 16,
		minHeight: 96,
	},
	pubkyRow: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
		backgroundColor: 'transparent',
	},
	iconContainer: {
		width: 38,
		height: 38,
		marginRight: 16,
		borderRadius: '50%',
		// overflow: 'hidden',
	},
	pubkyTextContainer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
});

export default memo(PubkyCard);
