import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { deletePubky, signOutOfHomeserver } from '../../utils/pubky.ts';
import { useDispatch } from 'react-redux';
import PubkyListHeader from './PubkyListHeader.tsx';
import { PubkyData } from '../../navigation/types.ts';
import { showToast } from '../../utils/helpers.ts';
import { showBackupPrompt } from '../../utils/sheetHelpers.ts';
import { View } from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { useTypedNavigation } from '../../navigation/hooks';
import i18n from '../../i18n';

export interface PubkyDetailProps {
	index: number;
    pubkyData: PubkyData;
	onQRPress: () => Promise<void>;
}

export const PubkyDetail = ({
	index,
	pubkyData,
	onQRPress,
}: PubkyDetailProps): ReactElement => {
	const { pubky, sessions } = pubkyData;
	const publicKey = useMemo(() => pubky.startsWith('pk:') ? pubky.slice(3) : pubky, [pubky]);
	const dispatch = useDispatch();
	const navigation = useTypedNavigation();

	const onDelete = useCallback(async () => {
		const deleteRes = await deletePubky(pubky, dispatch);
		if (deleteRes.isErr()) {
			showToast({
				type: 'error',
				title: i18n.t('pubkyErrors.failedToDelete'),
				description: i18n.t('pubkyErrors.deleteError'),
			});
			return;
		}
		SheetManager.hide('delete-pubky').then();
		navigation.goBack();
	}, [dispatch, navigation, pubky]);

	const onSignOut = useCallback((sessionSecret: string) => {
		signOutOfHomeserver(pubky, sessionSecret, dispatch);
	}, [dispatch, pubky]);

	const handleDelete = useCallback(() => {
		SheetManager.show('delete-pubky', {
			payload: {
				publicKey,
				onDelete,
			},
			onClose: () => {
				SheetManager.hide('delete-pubky');
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

	const sessionsLength = useMemo(() => sessions && sessions?.length > 0 ? sessions.length : 1, [sessions]);

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={true}
				bounces={false}
				nestedScrollEnabled={true}
			>
				<PubkyListHeader
					index={index}
					pubky={pubky}
					pubkyData={pubkyData}
					sessionsCount={sessionsLength}
					onQRPress={onQRPress}
					onDelete={handleDelete}
					onBackup={handleBackup}
				/>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 24,
	},
});

export default memo(PubkyDetail);
