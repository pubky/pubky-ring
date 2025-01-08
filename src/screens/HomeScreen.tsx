import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
} from 'react';
import {
	BackHandler,
	StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/types';
import EmptyState from '../components/EmptyState';
import { Pubky, TPubkys } from '../types/pubky';
import { createNewPubky } from '../utils/pubky';
import { showQRScanner, handleClipboardData, showToast } from '../utils/helpers';
import { importFile } from '../utils/rnfs';
import { View, Plus } from '../theme/components';
import PubkyRingHeader from '../components/PubkyRingHeader..tsx';
import Button from '../components/Button';
import { reorderPubkys } from '../store/slices/pubkysSlice.ts';
import PubkyBox from '../components/PubkyBox.tsx';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { getAllPubkys } from '../store/selectors/pubkySelectors.ts';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = (): ReactElement => {
	const navigation = useNavigation<NavigationProp>();
	const dispatch = useDispatch();
	const pubkys = useSelector(getAllPubkys);
	const hasPubkys = useMemo(() => Object.keys(pubkys).length > 0, [pubkys]);

	useEffect(() => {
		const backAction = (): boolean => true;
		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			backAction,
		);
		return (): void => backHandler.remove();
	}, []);

	const handlePubkyPress = useCallback(
		(pubky: string) => {
			navigation.navigate('PubkyDetail', { pubky });
		},
		[navigation],
	);

	const createPubky = useCallback(async () => {
		await createNewPubky(dispatch);
	}, [dispatch]);

	const importPubky = useCallback(async () => {
		const res = await importFile(dispatch);
		if (res.isErr()) {
			if (res.error?.message) {
				showToast({
					type: 'error',
					title: 'Error',
					description: res.error.message,
				});
			}
		} else {
			showToast({
				type: 'success',
				title: 'Success',
				description: 'Pubky imported successfully',
			});
		}
	}, [dispatch]);

	const handleDragEnd = useCallback(({ data }: { data: { key: string; value: Pubky }[]}) => {
		if (!data) {return;}
		const newPubkys: TPubkys = {};
		data.map(({ key, value }: { key: string; value: Pubky }) => {
			newPubkys[key] = value;
		});
		dispatch(reorderPubkys(newPubkys));
	}, [dispatch]);

	const pubkyArray = useMemo(() => {
		return Object.entries(pubkys).map(([key, value]) => ({
			key,
			value,
		}));
	}, [pubkys]);

	const ListFooter = useCallback(() => (
		<Button
			style={styles.button}
			text={'Create another pubky'}
			onPress={createPubky}
			onLongPress={importPubky}
			icon={<Plus size={16} />}
		/>
	), [createPubky, importPubky]);

	return (
		<View style={styles.container}>
			{hasPubkys ? (
				<DraggableFlatList
					data={pubkyArray}
					onDragEnd={handleDragEnd}
					keyExtractor={(item, index) => `${item.key}${index}`}
					renderItem={({ item, drag, getIndex, isActive }) => {
						const index = getIndex();
						return (
							<ScaleDecorator>
								<PubkyBox
									pubky={item.key}
									pubkyData={item.value}
									onQRPress={showQRScanner}
									onCopyClipboard={handleClipboardData}
									onPress={handlePubkyPress}
									index={index ?? 0}
									onLongPress={drag}
									disabled={isActive}
								/>
							</ScaleDecorator>
						);
					}}
					ListHeaderComponent={PubkyRingHeader}
					ListFooterComponent={ListFooter}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					showsHorizontalScrollIndicator={false}
				/>
			) : (
				<View style={styles.emptyContainer}>
					<EmptyState />
				</View>
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
	emptyContainer: {
		flex: 1,
		backgroundColor: 'white',
	},
	button: {
		width: '90%',
		borderRadius: 64,
		paddingVertical: 20,
		paddingHorizontal: 24,
		alignItems: 'center',
		alignSelf: 'center',
	},
});

export default memo(HomeScreen);
