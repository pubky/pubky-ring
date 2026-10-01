import React, { memo, ReactElement, useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import PubkyDetailCard from './PubkyDetailCard';
import AuthorizedGrantList from './AuthorizedGrantList';
import { PubkyData } from '../../navigation/types.ts';
import { showBackupSheet } from '../../utils/sheetHelpers.ts';
import { showSheet } from '../../sheets/sheetNavigation.tsx';
import { canPubkyAuthorize } from '../../store/selectors/pubkySelectors.ts';
import { HEADER_HEIGHT } from '../AppHeader.tsx';
import SafeAreaInset from '../SafeAreaInset.tsx';

export interface PubkyDetailProps {
	index: number;
	pubkyData: PubkyData;
	onQRPress: () => Promise<void>;
}

export const PubkyDetail = ({ index, pubkyData, onQRPress }: PubkyDetailProps): ReactElement => {
	const { pubky } = pubkyData;
	const showAuthorizedApps = canPubkyAuthorize(pubkyData);

	const handleDelete = useCallback(() => {
		showSheet('delete-pubky', { pubky });
	}, [pubky]);

	const handleBackup = useCallback(async () => {
		await showBackupSheet({ pubky, backupPreference: pubkyData.backupPreference });
	}, [pubky, pubkyData.backupPreference]);

	return (
		<ScrollView contentContainerStyle={styles.scrollContent}>
			<PubkyDetailCard
				index={index}
				pubky={pubky}
				pubkyData={pubkyData}
				onQRPress={onQRPress}
				onDelete={handleDelete}
				onBackup={handleBackup}
			/>
			{showAuthorizedApps && <AuthorizedGrantList pubkyData={pubkyData} />}
			<SafeAreaInset edge="bottom" />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingTop: HEADER_HEIGHT + 24,
		paddingHorizontal: 24,
	},
});

export default memo(PubkyDetail);
