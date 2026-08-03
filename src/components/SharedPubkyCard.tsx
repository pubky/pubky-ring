import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Card from './Card.tsx';
import Button from './Button.tsx';
import ProfileAvatar from './ProfileAvatar.tsx';
import { TextBaseB, TextXsSb } from '../theme/typography.ts';
import { SharedPubkyIdentity } from '../utils/sharedPubky.ts';
import { truncateStr } from '../utils/pubky.ts';
import { Key } from '../icons/index.ts';
import { showSheet } from '../sheets/sheetNavigation.tsx';

const SharedPubkyCard = ({ identity }: { identity: SharedPubkyIdentity }): ReactElement => {
	const { t } = useTranslation();
	const show = useCallback(() => showSheet('reuse-shared-pubky', { identities: [identity] }), [identity]);

	return (
		<View style={styles.container}>
			<Card>
				<View style={styles.identity}>
					<ProfileAvatar
						name={identity.name || t('emptyState.placeholderName')}
						pubky={identity.pubky}
						size={48}
						image={identity.image}
					/>
					<View style={styles.text}>
						<TextBaseB numberOfLines={1}>{identity.name || truncateStr(identity.pubky)}</TextBaseB>
						<TextXsSb colorName="mutedForeground">{t('reuseSharedPubky.source')}</TextXsSb>
					</View>
				</View>
				<Button
					text={t('reuseSharedPubky.useFromBitkit')}
					icon={<Key size={24} />}
					size="default"
					onPress={show}
				/>
			</Card>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 24,
		marginBottom: 16,
	},
	identity: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		marginBottom: 16,
	},
	text: {
		flex: 1,
	},
});

export default memo(SharedPubkyCard);
