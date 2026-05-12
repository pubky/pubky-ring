import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import EmptyState from '../components/EmptyState';
import { Pubky, TPubkys } from '../types/pubky';
import { View, Plus } from '../theme/components';
import Button from '../components/Button';
import { reorderPubkys } from '../store/slices/pubkysSlice.ts';
import PubkyBox from '../components/PubkyBox.tsx';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { getHomeScreenData } from '../store/selectors/pubkySelectors.ts';
import { useDeepLinkHandler } from '../hooks/useDeepLinkHandler';
import { usePubkyManagement } from '../hooks/usePubkyManagement';
import { showAddPubkySheet } from '../utils/sheetHelpers';
import HomeHeader from '../components/HomeHeader';
import { RootState } from '../store';
import { useTranslation } from 'react-i18next';
import { HEADER_HEIGHT } from '../components/AppHeader.tsx';
import SafeAreaView from '../components/SafeAreaView.tsx';
import SafeAreaInset from '../components/SafeAreaInset.tsx';

// Extract gradient props to constants to prevent unnecessary re-renders
const FADE_GRADIENT_COLORS = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)'];
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 0, y: 1 };

const PubkyItem = memo(
	({
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
	),
);

interface ListFooterProps {
	createPubky: () => void;
	importPubky: (mnemonic?: string) => Promise<any>;
}

const ListFooter = memo(({ createPubky, importPubky }: ListFooterProps) => {
	const { t } = useTranslation();

	const onAddPubkyPress = useCallback(() => {
		showAddPubkySheet(createPubky, importPubky);
	}, [createPubky, importPubky]);

	return (
		<View style={styles.listFooterContainer}>
			<Button
				testID="AddPubkyButton"
				style={styles.listFooterButton}
				text={t('home.addPubky')}
				size="large"
				onPress={onAddPubkyPress}
				icon={<Plus size={24} strokeWidth={1.5} />}
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

	const handleDragEnd = useCallback(
		({ data }: { data: { key: string; value: Pubky }[] }) => {
			if (!data) {
				return;
			}
			const newPubkys: TPubkys = {};
			data.forEach(({ key, value }) => {
				newPubkys[key] = value;
			});
			dispatch(reorderPubkys(newPubkys));
		},
		[dispatch],
	);

	const renderItem = useCallback(
		({ item, drag, getIndex, isActive }: RenderItemParams<{ key: string; value: Pubky }>) => {
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
		},
		[pubkysProcessing],
	);

	const getItemLayout = useCallback(
		(data: any, index: number) => ({
			length: 172,
			offset: 172 * index,
			index,
		}),
		[],
	);

	const keyExtractor = useCallback(
		(item: { key: string; value: Pubky }, index: number) => `${item.key}-${index}`,
		[],
	);

	const hasPubkys = useMemo(() => {
		return pubkyArray.length > 0;
	}, [pubkyArray.length]);

	if (!hasPubkys) {
		return (
			<SafeAreaView style={styles.container} edges={['bottom']}>
				<HomeHeader />
				<EmptyState />
				<View style={styles.emptyFooterContainer}>
					<ListFooter createPubky={createPubky} importPubky={importPubky} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View style={styles.container}>
			<HomeHeader />
			<DraggableFlatList
				data={pubkyArray}
				onDragEnd={handleDragEnd}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				showsHorizontalScrollIndicator={false}
				getItemLayout={getItemLayout}
			/>
			{/* Fixed footer */}
			<View style={styles.fixedFooterContainer}>
				<LinearGradient
					style={styles.fadeOverlay}
					colors={FADE_GRADIENT_COLORS}
					start={GRADIENT_START}
					end={GRADIENT_END}
					pointerEvents="none"
				/>
				<ListFooter createPubky={createPubky} importPubky={importPubky} />
				<SafeAreaInset edge="bottom" />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	emptyFooterContainer: {
		backgroundColor: 'transparent',
	},
	listContent: {
		paddingTop: HEADER_HEIGHT + 24,
		paddingBottom: 180,
	},
	fadeOverlay: {
		position: 'absolute',
		top: -100,
		left: 0,
		right: 0,
		height: 100,
		zIndex: 1,
	},
	fixedFooterContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#000000',
		paddingTop: 16,
		zIndex: 2,
	},
	listFooterContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 16,
		paddingHorizontal: 24,
		backgroundColor: 'transparent',
	},
	listFooterButton: {
		flex: 1,
	},
});

export default memo(HomeScreen);
