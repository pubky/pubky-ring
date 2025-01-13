import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import jdenticon from 'jdenticon';
import { Pubky, PubkySession } from '../../types/pubky.ts';
import { deletePubky, signOutOfHomeserver } from '../../utils/pubky.ts';
import { useDispatch } from 'react-redux';
import { FlashList } from '@shopify/flash-list';
import SessionItem from './SessionItem.tsx';
import PubkyListHeader from './PubkyListHeader.tsx';
import { PubkyData } from '../../navigation/types.ts';
import { getKeychainValue } from '../../utils/keychain.ts';
import { showBackupPrompt, showToast } from '../../utils/helpers.ts';
import { Dispatch } from 'redux';
import { Result } from '@synonymdev/result';
import { View } from '../../theme/components.ts';
import { SheetManager } from 'react-native-actions-sheet';
import { useNavigation } from '@react-navigation/native';

export interface PubkyDetailProps {
    pubkyData: PubkyData;
	onQRPress: ({
		pubky,
		pubkyData,
		dispatch,
		onComplete,
	}: {
		pubky: string,
		pubkyData: Pubky,
		dispatch: Dispatch,
		onComplete?: () => void,
	}) => Promise<string>;
    onCopyClipboard: ({
    	pubky,
    	pubkyData,
    	dispatch,
    }: {
		pubky: string;
		pubkyData: Pubky;
		dispatch: Dispatch;
	}) => Promise<Result<string>>
}

export const PubkyDetail = ({
	pubkyData,
	onQRPress,
	onCopyClipboard,
}: PubkyDetailProps): ReactElement => {
	const { pubky, sessions } = pubkyData;
	const publicKey = useMemo(() => pubky.startsWith('pk:') ? pubky.slice(3) : pubky, [pubky]);
	const svg = useMemo(() => jdenticon.toSvg(publicKey, 120), [publicKey]);
	const dispatch = useDispatch();
	const navigation = useNavigation();

	const handleQRPress = useCallback(() => {
		return onQRPress({ pubky, pubkyData, dispatch });
	}, [dispatch, onQRPress, pubky, pubkyData]);

	const handleCopyClipboard = useCallback(async () => {
		return onCopyClipboard({ pubky, pubkyData, dispatch });
	}, [dispatch, onCopyClipboard, pubky, pubkyData]);

	const onDelete = useCallback(async () => {
		const deleteRes = await deletePubky(pubky, dispatch);
		if (deleteRes.isErr()) {
			showToast({
				type: 'error',
				title: 'Failed to delete Pubky',
				description: 'An error occurred while deleting the Pubky.',
			});
			return;
		}
		SheetManager.hide('delete-pubky').then();
		navigation.goBack();
	}, [dispatch, navigation, pubky]);

	const onSignOut = useCallback((sessionPubky: string) => {
		signOutOfHomeserver(pubky, sessionPubky, dispatch);
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
			const secretKeyResponse = await getKeychainValue({ key: pubky });
			if (secretKeyResponse.isErr()) {
				showToast({
					type: 'error',
					title: 'Error',
					description: 'Could not retrieve secret key for backup',
				});
				return;
			}
			showBackupPrompt({ secretKey: secretKeyResponse.value, pubky });

		} catch (error) {
			console.error('Backup process error:', error);
			showToast({
				type: 'error',
				title: 'Backup process error',
				description: JSON.stringify(error),
			});
		}
	}, [pubky]);

	const keyExtractor = useCallback((item: PubkySession, index: number) =>
		`${item.created_at}-${index}`, []);

	// eslint-disable-next-line react/no-unused-prop-types
	const renderItem = useCallback(({ item }: { item: PubkySession }) =>
		<SessionItem session={item} onSignOut={onSignOut} />, [onSignOut]);

	const sessionsLength = useMemo(() => sessions && sessions?.length > 0 ? sessions.length : 1, [sessions]);

	const ListHeader = useCallback(() => (
		<PubkyListHeader
			svg={svg}
			pubky={pubky}
			pubkyData={pubkyData}
			sessionsCount={sessionsLength}
			onQRPress={handleQRPress}
			onCopyClipboard={handleCopyClipboard}
			onDelete={handleDelete}
			onBackup={handleBackup}
		/>
	), [svg, pubky, pubkyData, sessionsLength, handleQRPress, handleCopyClipboard, handleDelete, handleBackup]);

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
