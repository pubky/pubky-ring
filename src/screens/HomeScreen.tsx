import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
} from 'react';
import { Platform, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import EmptyState from '../components/EmptyState';
import { Pubky, TPubkys } from '../types/pubky';
import {
	View,
	Plus,
	Scan,
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
import { useInputHandler } from '../hooks/useInputHandler';
import { showAddPubkySheet } from '../utils/sheetHelpers';
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
	onShowQRPress: () => void;
}

const ListFooter = memo(({ createPubky, importPubky, onShowQRPress }: ListFooterProps) => {
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
				onPress={onAddPubkyPress}
				icon={<Plus size={16} />}
			/>
			<Button
				testID="ShowQRButton"
				style={styles.scanQRButton}
				text={t('home.scanQR')}
				onPress={onShowQRPress}
				icon={<Scan size={16} />}
			/>
		</View>
	);
});

const HomeScreen = (): ReactElement => {
	const dispatch = useDispatch();
	const { pubkyArray } = useSelector(getHomeScreenData, shallowEqual);
	const pubkysProcessing = useSelector((state: RootState) => state.pubky.processing, shallowEqual);

	const { createPubky, importPubky } = usePubkyManagement();
	const { showScanner } = useInputHandler();
	useDeepLinkHandler(createPubky, importPubky);

	// HomeScreen scanner - no filter, allows all actions
	const onShowQRPress = useCallback(() => {
		showScanner();
	}, [showScanner]);

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

	if (!hasPubkys) {
		return (
			<View style={styles.emptyContainer}>
				<AppHeader />
				<EmptyState />
				<View style={styles.emptyFooterContainer}>
					<ListFooter createPubky={createPubky} importPubky={importPubky} onShowQRPress={onShowQRPress} />
				</View>
			</View>
		);
	}

	return (
		<View style={styles.listContainer}>
			<DraggableFlatList
				data={pubkyArray}
				onDragEnd={handleDragEnd}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				ListHeaderComponent={<ListHeader />}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				showsHorizontalScrollIndicator={false}
				getItemLayout={getItemLayout}
			/>
			{/* Fade overlay */}
			<LinearGradient
				style={styles.fadeOverlay}
				colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				pointerEvents="none"
			/>
			{/* Fixed footer */}
			<View style={styles.fixedFooterContainer}>
				<ListFooter createPubky={createPubky} importPubky={importPubky} onShowQRPress={onShowQRPress} />
			</View>
		</View>
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
	listContainer: {
		flex: 1,
		position: 'relative',
		backgroundColor: 'transparent',
	},
	listContent: {
		paddingBottom: 180,
	},
	fadeOverlay: {
		position: 'absolute',
		bottom: 100,
		left: 0,
		right: 0,
		height: 80,
		zIndex: 1,
	},
	fixedFooterContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#000000',
		paddingTop: 16,
		paddingBottom: Platform.select({ ios: 34, android: 24 }),
		zIndex: 2,
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
