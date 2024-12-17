import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import jdenticon from 'jdenticon';
import { Pubky, PubkySession } from '../../types/pubky.ts';
import { deletePubky, signOutOfHomeserver } from '../../utils/pubky.ts';
import { useDispatch } from 'react-redux';
import { FlashList } from '@shopify/flash-list';
import SessionItem from './SessionItem.tsx';
import PubkyListHeader from './PubkyListHeader.tsx';
import { PubkyData } from '../../navigation/types.ts';
import { getKeychainValue } from '../../utils/keychain.ts';
import { showBackupPrompt } from '../../utils/helpers.ts';
import { Dispatch } from 'redux';
import { Result } from '@synonymdev/result';
import { View } from '../../theme/components.ts';

export interface PubkyDetailProps {
    pubkyData: PubkyData;
    onClose: () => void;
    onQRPress: (pubky: string, pubkyData: Pubky, dispatch: Dispatch, onComplete?: () => void) => Promise<string>
    onCopyClipboard: (pubky: string, pubkyData: Pubky, dispatch: Dispatch) => Promise<Result<string>>
}

export const PubkyDetail = ({
	pubkyData,
	onClose,
	onQRPress,
	onCopyClipboard,
}: PubkyDetailProps): ReactElement => {
	const { pubky, sessions } = pubkyData;
	const publicKey = useMemo(() => pubky.startsWith('pk:') ? pubky.slice(3) : pubky, [pubky]);
	const svg = useMemo(() => jdenticon.toSvg(publicKey, 120), [publicKey]);
	const dispatch = useDispatch();

	const handleQRPress = useCallback(() => {
		return onQRPress(pubky, pubkyData, dispatch, onClose);
	}, [dispatch, onClose, onQRPress, pubky, pubkyData]);

	const handleCopyClipboard = useCallback(async () => {
		return onCopyClipboard(pubky, pubkyData, dispatch);
	}, [dispatch, onCopyClipboard, pubky, pubkyData]);

	const onDelete = useCallback(async () => {
		const deleteRes = await deletePubky(pubky, dispatch);
		if (deleteRes.isErr()) {
			Alert.alert('Failed to delete Pubky', 'An error occurred while deleting the Pubky.');
		}
	}, [dispatch, pubky]);

	const onSignOut = useCallback((sessionPubky: string) => {
		signOutOfHomeserver(pubky, sessionPubky, dispatch);
	}, [dispatch, pubky]);

	const handleDelete = useCallback(() => {
		Alert.alert(
			'Delete Pubky',
			'Are you sure you want to delete this pubky? This action cannot be undone.',
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Delete',
					onPress: (): void => {
						onDelete?.();
						onClose();
					},
					style: 'destructive',
				},
			]
		);
	}, [onClose, onDelete]);

	const handleBackup = useCallback(async () => {
		try {
			const secretKeyResponse = await getKeychainValue({ key: pubky });
			if (secretKeyResponse.isErr()) {
				Alert.alert('Error', 'Could not retrieve secret key for backup');
				return;
			}

			showBackupPrompt(secretKeyResponse.value);

		} catch (error) {
			console.error('Backup process error:', error);
			Alert.alert('Backup process error', JSON.stringify(error));
		}
	}, [pubky]);

	const keyExtractor = useCallback((item: PubkySession, index: number) =>
		`${item.created_at}-${index}`, []);

	// eslint-disable-next-line react/no-unused-prop-types
	const renderItem = useCallback(({ item }: { item: PubkySession }) =>
		<SessionItem session={item} onSignOut={onSignOut} />, [onSignOut]);

	const ListHeader = useCallback(() => (
		<PubkyListHeader
			svg={svg}
			pubky={pubky}
			pubkyData={pubkyData}
			sessionsCount={sessions.length}
			onQRPress={handleQRPress}
			onCopyClipboard={handleCopyClipboard}
			onDelete={handleDelete}
			onBackup={handleBackup}
		/>
	), [svg, pubky, pubkyData, sessions.length, handleQRPress, handleCopyClipboard, handleDelete, handleBackup]);

	const sessionsLength = useMemo(() => sessions.length > 0 ? sessions.length : 1, [sessions]);

	return (
		<View style={styles.container}>
			<FlashList
				ListHeaderComponent={ListHeader}
				keyExtractor={keyExtractor}
				contentContainerStyle={styles.scrollContent}
				data={[]}
				renderItem={renderItem}
				estimatedItemSize={sessionsLength}
				showsVerticalScrollIndicator={true}
				scrollEventThrottle={16}
				bounces={false}
				nestedScrollEnabled={true}
			/>
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
