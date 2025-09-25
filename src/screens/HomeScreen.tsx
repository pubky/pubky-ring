import React, {
	memo,
	ReactElement,
	useCallback,
} from 'react';
import { StyleSheet } from 'react-native';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import EmptyState from '../components/EmptyState';
import { Pubky, TPubkys } from '../types/pubky';
import {
	View,
	Plus,
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
import AppHeader from '../components/AppHeader';
import { buttonStyles } from '../theme/utils';
import ScanInviteButton from '../components/ScanInviteButton';
import { ENABLE_INVITE_SCANNER } from "../utils/constants.ts";
import { RootState } from '../store';

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
	const onPress = useCallback(() => {
		showAddPubkySheet(createPubky, importPubky);
	}, [createPubky, importPubky]);

	return (
		<Button
			testID="AddPubkyButton"
			style={styles.listFooter}
			text={'Add pubky'}
			onPress={onPress}
			icon={<Plus size={16} />}
		/>
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

	const hasPubkys = pubkyArray.length > 0;

	return (
		<View style={styles.container}>
			<View style={styles.container}>
				<DraggableFlatList
					data={pubkyArray}
					onDragEnd={handleDragEnd}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
					ListHeaderComponent={<ListHeader />}
					ListFooterComponent={hasPubkys ? <ListFooter createPubky={createPubky} importPubky={importPubky} /> : null}
					ListEmptyComponent={<EmptyState />}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
					getItemLayout={getItemLayout}
				/>
			</View>
			{ENABLE_INVITE_SCANNER && (
				<ScanInviteButton />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingBottom: '100%',
	},
	listFooter: {
		...buttonStyles.primary,
		width: '90%',
		alignSelf: 'center',
	},
});

export default memo(HomeScreen);
