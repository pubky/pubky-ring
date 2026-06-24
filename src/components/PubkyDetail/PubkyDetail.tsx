import React, { memo, ReactElement, useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { signOutOfHomeserver } from '../../utils/pubky.ts';
import { useDispatch } from 'react-redux';
import PubkyDetailCard from './PubkyDetailCard';
import { PubkyData } from '../../navigation/types.ts';
import { showToast } from '../../utils/helpers.ts';
import { showBackupPrompt } from '../../utils/sheetHelpers.ts';
import { SheetManager } from 'react-native-actions-sheet';
import i18n from '../../i18n';
import { HEADER_HEIGHT } from '../AppHeader.tsx';

export interface PubkyDetailProps {
	index: number;
	pubkyData: PubkyData;
	onQRPress: () => Promise<void>;
	onDelete: () => Promise<void>;
}

export const PubkyDetail = ({ index, pubkyData, onQRPress, onDelete }: PubkyDetailProps): ReactElement => {
	const { pubky, sessions } = pubkyData;
	const publicKey = pubky.startsWith('pk:') ? pubky.slice(3) : pubky;
	const dispatch = useDispatch();

	const onSignOut = useCallback(
		(sessionSecret: string) => {
			signOutOfHomeserver(pubky, sessionSecret, dispatch);
		},
		[dispatch, pubky],
	);

	const handleDelete = useCallback(() => {
		SheetManager.show('delete-pubky', {
			payload: {
				publicKey,
				onDelete,
			},
		});
	}, [onDelete, publicKey]);

	const handleBackup = useCallback(async () => {
		try {
			showBackupPrompt({ pubky, backupPreference: pubkyData.backupPreference });
		} catch (error) {
			console.error('Backup process error:', error);
			showToast({
				type: 'error',
				title: i18n.t('pubkyErrors.backupProcessError'),
				description: JSON.stringify(error),
			});
		}
	}, [pubky, pubkyData.backupPreference]);

	const sessionsLength = sessions?.length > 0 ? sessions.length : 1;

	return (
		<ScrollView
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={true}
			bounces={false}
			nestedScrollEnabled={true}
		>
			<PubkyDetailCard
				index={index}
				pubky={pubky}
				pubkyData={pubkyData}
				onQRPress={onQRPress}
				onDelete={handleDelete}
				onBackup={handleBackup}
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingTop: HEADER_HEIGHT + 24,
	},
});

export default memo(PubkyDetail);
