import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import EmptyState from '../components/EmptyState';
import { Pubky, TPubkys } from '../types/pubky';
import {
	View,
	Plus,
	QrCode,
} from '../theme/components';
import Button from '../components/Button';
import { reorderPubkys } from '../store/slices/pubkysSlice.ts';
import PubkyBox from '../components/PubkyBox.tsx';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import {
	getHomeScreenData,
} from '../store/selectors/pubkySelectors.ts';
import { useDeepLinkHandler } from '../hooks/useDeepLinkHandler';
import { usePubkyManagement } from '../hooks/usePubkyManagement';
import { showAddPubkySheet } from '../utils/sheetHelpers';
import { SheetManager } from 'react-native-actions-sheet';
import { readFromClipboard } from '../utils/clipboard';
import { showToast } from '../utils/helpers';
import { parseInput, InputAction } from '../utils/inputParser';
import { routeInput } from '../utils/inputRouter';
import i18n from '../i18n';
import AppHeader from '../components/AppHeader';
import { buttonStyles } from '../theme/utils';
import { RootState } from '../store';
import { useTranslation } from 'react-i18next';

const PubkyItem = memo(({
	item,
	drag,
	isActive,
	index,
	loading = false,
}: {
	item: { key: string; value: Pubky };
	drag: () => void;
	isActive: boolean;
	index: number;
  loading?: boolean;
}) => (
	<ScaleDecorator>
		<PubkyBox
			pubky={item.key}
			pubkyData={item.value}
			index={index}
			onLongPress={drag}
			disabled={isActive}
			loading={loading}
		/>
	</ScaleDecorator>
));

const ListHeader = memo(() => <AppHeader />);

interface ListFooterProps {
	createPubky: () => void;
	importPubky: (mnemonic?: string) => Promise<any>;
}

const ListFooter = memo(({ createPubky, importPubky }: ListFooterProps) => {
	const { t } = useTranslation();
	const dispatch = useDispatch();

	const onAddPubkyPress = useCallback(() => {
		showAddPubkySheet(createPubky, importPubky);
	}, [createPubky, importPubky]);

	const onShowQRPress = useCallback(async () => {
		await SheetManager.show('camera', {
			payload: {
				title: i18n.t('import.title'),
				onScan: async (data: string) => {
					await SheetManager.hide('camera');
					const parsed = await parseInput(data, 'scan');

					if (parsed.action === InputAction.Signup ||
						parsed.action === InputAction.Import ||
						parsed.action === InputAction.Invite) {
						await routeInput(parsed, { dispatch });
					} else {
						showToast({
							type: 'error',
							title: i18n.t('import.invalidData'),
							description: i18n.t('import.invalidClipboardData'),
						});
					}
				},
				onCopyClipboard: async (): Promise<void> => {
					await SheetManager.hide('camera');
					const clipboardContents = await readFromClipboard();
					if (!clipboardContents) {
						showToast({
							type: 'error',
							title: i18n.t('common.error'),
							description: i18n.t('errors.emptyClipboard'),
						});
						return;
					}

					const parsed = await parseInput(clipboardContents, 'clipboard');

					if (parsed.action === InputAction.Signup ||
						parsed.action === InputAction.Import ||
						parsed.action === InputAction.Invite) {
						await routeInput(parsed, { dispatch });
					} else {
						showToast({
							type: 'error',
							title: i18n.t('import.invalidData'),
							description: i18n.t('import.invalidClipboardData'),
						});
					}
				},
				onClose: () => {
					SheetManager.hide('camera');
				},
			},
		});
	}, [dispatch]);

	return (
		<View style={styles.listFooterContainer}>
			<Button
				testID="AddPubkyButton"
				style={styles.listFooterButton}
				text={t('home.addPubky')}
				onPress={onAddPubkyPress}
				icon={<Plus size={16} />}
			/>
			<Button
				testID="ShowQRButton"
				style={styles.scanQRButton}
				text={t('home.scanQR')}
				onPress={onShowQRPress}
				icon={<QrCode size={16} />}
			/>
		</View>
	);
});

const HomeScreen = (): ReactElement => {
	const dispatch = useDispatch();
	const { pubkyArray } = useSelector(getHomeScreenData, shallowEqual);
	const pubkysProcessing = useSelector((state: RootState) => state.pubky.processing, shallowEqual);

	const { createPubky, importPubky } = usePubkyManagement();
	useDeepLinkHandler(createPubky, importPubky);

	const handleDragEnd = useCallback(({ data }: { data: { key: string; value: Pubky }[] }) => {
		if (!data) {return;}
		const newPubkys: TPubkys = {};
		data.forEach(({ key, value }) => {
			newPubkys[key] = value;
		});
		dispatch(reorderPubkys(newPubkys));
	}, [dispatch]);

	const renderItem = useCallback(({
		item,
		drag,
		getIndex,
		isActive,
	}: RenderItemParams<{ key: string; value: Pubky }>) => {
		const index = getIndex() ?? 0;
		return (
			<PubkyItem
				item={item}
				drag={drag}
				isActive={isActive}
				index={index}
				loading={pubkysProcessing[item.key]}
			/>
		);
	}, [pubkysProcessing]);

	const getItemLayout = useCallback((data: any, index: number) => ({
		length: 172,
		offset: 172 * index,
		index,
	}), []);

	const keyExtractor = useCallback((item: { key: string; value: Pubky }, index: number) =>
		`${item.key}-${index}`, []);

	const hasPubkys = useMemo(() => {
		return pubkyArray.length > 0;
	}, [pubkyArray.length]);

	const ListFooterComponent = useMemo(() => {
		return <ListFooter createPubky={createPubky} importPubky={importPubky} />;
	}, [createPubky, importPubky]);

	if (!hasPubkys) {
		return (
			<View style={styles.emptyContainer}>
				<AppHeader />
				<EmptyState />
				<View style={styles.emptyFooterContainer}>
					<ListFooter createPubky={createPubky} importPubky={importPubky} />
				</View>
			</View>
		);
	}

	return (
		<DraggableFlatList
			data={pubkyArray}
			onDragEnd={handleDragEnd}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			ListHeaderComponent={<ListHeader />}
			ListFooterComponent={ListFooterComponent}
			contentContainerStyle={styles.listContent}
			showsVerticalScrollIndicator={false}
			showsHorizontalScrollIndicator={false}
			getItemLayout={getItemLayout}
		/>
	);
};

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	emptyFooterContainer: {
		paddingBottom: Platform.select({ ios: 34, android: 24 }),
		backgroundColor: 'transparent',
	},
	listContent: {
		paddingBottom: '100%',
	},
	listFooterContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 20,
		backgroundColor: 'transparent',
	},
	listFooterButton: {
		...buttonStyles.primary,
		flex: 1,
	},
	scanQRButton: {
		...buttonStyles.primary,
		borderWidth: 1,
		flex: 1,
	}
});

export default memo(HomeScreen);
