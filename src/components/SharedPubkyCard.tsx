import React, { memo, ReactElement, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Card from './Card.tsx';
import Button from './Button.tsx';
import ProfileAvatar from './ProfileAvatar.tsx';
import { PubkyInfo, pubkyCardStyles } from './PubkyBox.tsx';
import { DASHED_BORDER_COLOR } from '../theme';
import { SharedPubkyIdentity } from '../utils/sharedPubky.ts';
import { truncateStr } from '../utils/pubky.ts';
import { getFallbackPubkyName } from '../utils/pubkyName.ts';
import { ChevronRight, Plus } from '../icons/index.ts';
import { showSheet } from '../sheets/sheetNavigation.tsx';

interface SharedPubkyCardProps {
	identity: SharedPubkyIdentity;
	/** Zero-based position in the home list, used for the presentational fallback name. */
	index: number;
}

/**
 * An identity another app (Bitkit) offers but Ring has not adopted yet: same anatomy as a
 * connected pubky, outlined with a dashed border. Card body, chevron and button all open the
 * same sheet; nothing here touches key material.
 */
const SharedPubkyCard = ({ identity, index }: SharedPubkyCardProps): ReactElement => {
	const { t } = useTranslation();

	const handlePress = useCallback(
		() => showSheet('reuse-shared-pubky', { identity, index }),
		[identity, index],
	);

	const publicKey = identity.pubky.startsWith('pk:') ? identity.pubky.slice(3) : identity.pubky;
	const name = identity.name ?? '';
	const pubkyName = truncateStr(name, 8) || getFallbackPubkyName({ index, isBorrowed: true });

	// testId example: SharedPubkyCard-StagingTestPubky-1
	const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '');
	const cardTestID = `SharedPubkyCard-${sanitizedName}-${index}`;

	return (
		<View style={styles.container} testID={cardTestID}>
			<Card style={styles.card}>
				<TouchableOpacity
					style={styles.cardPressTarget}
					activeOpacity={0.7}
					testID={`${cardTestID}-Content`}
					onPress={handlePress}
				/>

				<View style={styles.content} pointerEvents="box-none">
					<View style={styles.profileImage} pointerEvents="none">
						<ProfileAvatar name={name || pubkyName} pubky={publicKey} size={48} image={identity.image} />
					</View>

					<PubkyInfo
						pubkyName={pubkyName}
						publicKey={publicKey}
						isBackedUp={true}
						isBorrowed={true}
						sessionsCount={0}
					/>

					<View style={styles.iconContainer} pointerEvents="none">
						<ChevronRight colorName="foreground" />
					</View>
				</View>

				<Button
					style={styles.button}
					text={t('reuseSharedPubky.useInRing')}
					size="large"
					variant="secondary"
					dashed={true}
					icon={<Plus />}
					testID={`${cardTestID}-ActionButton`}
					onPress={handlePress}
				/>
			</Card>
		</View>
	);
};

const styles = StyleSheet.create({
	...pubkyCardStyles,
	card: {
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: DASHED_BORDER_COLOR,
	},
});

export default memo(SharedPubkyCard);
