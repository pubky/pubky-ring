import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import React, { memo, ReactElement } from 'react';
import ProfileAvatar from './ProfileAvatar.tsx';
import { Text2Xl, TextBaseB } from '../theme/typography';
import { truncatePubky } from '../utils/pubky.ts';
import { ChevronRight } from '../icons/index.ts';
import Card from './Card.tsx';

interface PubkyCardProps {
	publicKey: string;
	name?: string;
	style?: StyleProp<ViewStyle>;
	avatarSize?: number;
	showChevron?: boolean;
}

const PubkyCard = ({
	publicKey,
	name,
	style,
	avatarSize = 48,
	showChevron = false,
}: PubkyCardProps): ReactElement => {
	return (
		<Card style={[styles.container, style]}>
			<View style={styles.avatar}>
				<ProfileAvatar name={name} pubky={publicKey} size={avatarSize} />
			</View>

			<View style={styles.text}>
				{name && (
					<Text2Xl style={styles.name} numberOfLines={1}>
						{name}
					</Text2Xl>
				)}
				<TextBaseB numberOfLines={1}>{truncatePubky(publicKey)}</TextBaseB>
			</View>

			{showChevron && <ChevronRight colorName="foreground" />}
		</Card>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		minHeight: 96,
		paddingVertical: 16,
	},
	avatar: {
		width: 48,
		height: 48,
		marginRight: 16,
		borderRadius: '50%',
		overflow: 'hidden',
	},
	text: {
		flex: 1,
		paddingRight: 16,
	},
	name: {
		marginBottom: 2,
	},
});

export default memo(PubkyCard);
