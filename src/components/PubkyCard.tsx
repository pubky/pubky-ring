import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import { CardGradient } from '../theme/components.ts';
import React, { memo, ReactElement } from 'react';
import ProfileAvatar from './ProfileAvatar.tsx';
import { BodySSBText, HeadingText } from '../theme/typography';
import { truncatePubky } from '../utils/pubky.ts';
import { ChevronRight } from '../icons/index.ts';

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
		<CardGradient style={[styles.container, style]}>
			<View style={styles.row}>
				<View style={styles.avatar}>
					<ProfileAvatar pubky={publicKey} size={avatarSize} />
				</View>
				<View style={styles.text}>
					{name && (
						<HeadingText style={styles.name} numberOfLines={1}>
							{name}
						</HeadingText>
					)}
					<BodySSBText numberOfLines={1}>{truncatePubky(publicKey)}</BodySSBText>
				</View>

				{showChevron && <ChevronRight colorName="textTertiary" />}
			</View>
		</CardGradient>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		minHeight: 96,
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 24,
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
