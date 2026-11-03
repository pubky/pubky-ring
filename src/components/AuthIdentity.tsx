import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { Key } from '../icons';
import { TextBaseB, TextBaseM } from '../theme/typography';
import { truncatePubky } from '../utils/pubky';
import ProfileAvatar from './ProfileAvatar';

interface AuthIdentityProps {
	pubky: string;
	name?: string;
}

const AuthIdentity = ({ pubky, name }: AuthIdentityProps): ReactElement => (
	<View style={styles.container} testID="AuthIdentity">
		<ProfileAvatar pubky={pubky} name={name} size={20} />
		<TextBaseB numberOfLines={1} style={styles.name}>
			{name || truncatePubky(pubky)}
		</TextBaseB>
		{!!name && (
			<View style={styles.publicKey}>
				<Key size={16} colorName="mutedForeground" />
				<TextBaseM colorName="mutedForeground" numberOfLines={1}>
					{truncatePubky(pubky)}
				</TextBaseM>
			</View>
		)}
	</View>
);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 999,
		backgroundColor: '#1C1C1C',
		maxWidth: '100%',
	},
	name: { flexShrink: 1 },
	publicKey: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' },
});

export default memo(AuthIdentity);
